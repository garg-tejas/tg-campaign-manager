import { NextRequest, NextResponse } from 'next/server'
import { campaigns, messages, channels } from '@/lib/queries'
import { deleteMessage } from '@/lib/telegram'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { channelIds } = await request.json()

    const campaign = campaigns.getById(parseInt(id))
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json(
        { error: 'Channel IDs are required' },
        { status: 400 }
      )
    }

    const results = []
    
    for (const channelId of channelIds) {
      const message = messages.getByCampaignAndChannel(parseInt(id), channelId)
      if (!message || message.status !== 'sent') {
        results.push({ channelId, success: false, error: 'No sent message found' })
        continue
      }

      const channel = channels.getById(channelId)
      if (!channel) {
        results.push({ channelId, success: false, error: 'Channel not found' })
        continue
      }
      try {
        await deleteMessage(channel.telegram_id, parseInt(message.telegram_message_id!))
        messages.updateStatus(message.id, 'deleted')

        // Delete all child messages (replies)
        const childMessages = messages.getChildMessages(message.id)
        let deletedReplies = 0
        let failedReplies = 0

        for (const childMessage of childMessages) {
          if (childMessage.telegram_message_id) {
            try {
              await deleteMessage(channel.telegram_id, parseInt(childMessage.telegram_message_id))
              messages.updateStatus(childMessage.id, 'deleted')
              deletedReplies++
            } catch (childErr) {
              const childError = childErr as Error
              // Handle already-deleted messages gracefully
              if (childError.message.includes('message to delete not found') || childError.message.includes("message can't be deleted")) {
                messages.updateStatus(childMessage.id, 'deleted')
                deletedReplies++
              } else {
                messages.updateStatus(childMessage.id, 'delete_failed', { error: childError.message })
                failedReplies++
              }
            }
          }
        }
        
        results.push({ 
          channelId, 
          success: true, 
          deletedReplies,
          failedReplies: failedReplies > 0 ? failedReplies : undefined
        })
      } catch (err) {
        const error = err as Error
        if (error.message.includes('message to delete not found') || error.message.includes("message can't be deleted")) {
          messages.updateStatus(message.id, 'deleted')

          // Still try to delete child messages even if parent was already deleted
          const childMessages = messages.getChildMessages(message.id)
          let deletedReplies = 0
          for (const childMessage of childMessages) {
            if (childMessage.telegram_message_id) {
              try {
                await deleteMessage(channel.telegram_id, parseInt(childMessage.telegram_message_id))
                messages.updateStatus(childMessage.id, 'deleted')
                deletedReplies++
              } catch {
              }
            }
          }

          results.push({ channelId, success: true, note: 'Already deleted', deletedReplies })
        } else {
          messages.updateStatus(message.id, 'delete_failed', { error: error.message })
          results.push({ channelId, success: false, error: error.message })
        }
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({ 
      success: failCount === 0,
      deleted: successCount,
      failed: failCount,
      results 
    })
  } catch (error) {
    console.error('Error deleting messages:', error)
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    )
  }
}
