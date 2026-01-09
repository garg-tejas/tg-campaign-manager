import { NextRequest, NextResponse } from 'next/server'
import { campaigns, messages } from '@/lib/queries'
import { campaignQueue } from '@/lib/queue'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { channelIds, replyText } = await request.json()

    const campaign = campaigns.getById(parseInt(id))
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!replyText || typeof replyText !== 'string' || replyText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply text is required' },
        { status: 400 }
      )
    }

    if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json(
        { error: 'Channel IDs are required' },
        { status: 400 }
      )
    }

    for (const channelId of channelIds) {
      const message = messages.getByCampaignAndChannel(parseInt(id), channelId)
      if (!message || message.status !== 'sent') {
        return NextResponse.json(
          { error: `No sent message found for channel ${channelId}` },
          { status: 400 }
        )
      }
    }

    for (const channelId of channelIds) {
      await campaignQueue.add(
        'reply',
        {
          campaignId: parseInt(id),
          channelId,
          replyText: replyText.trim(),
        },
        { jobId: `reply-${id}-${channelId}-${Date.now()}` }
      )
    }

    return NextResponse.json({ queued: channelIds.length })
  } catch (error) {
    console.error('Error queuing reply jobs:', error)
    return NextResponse.json(
      { error: 'Failed to queue reply jobs' },
      { status: 500 }
    )
  }
}
