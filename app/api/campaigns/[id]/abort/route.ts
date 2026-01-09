import { NextRequest, NextResponse } from 'next/server'
import { campaigns, messages } from '@/lib/queries'
import { campaignQueue } from '@/lib/queue'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const campaignId = parseInt(id)
    const campaign = campaigns.getById(campaignId)

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if campaign can be aborted (must be sending or scheduled)
    if (campaign.status !== 'sending' && campaign.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Campaign cannot be aborted. Only sending or scheduled campaigns can be aborted.' },
        { status: 400 }
      )
    }

    let removedCount = 0

    const allJobs = [
      ...(await campaignQueue.getWaiting()),
      ...(await campaignQueue.getActive()),
      ...(await campaignQueue.getDelayed()),
    ]

    for (const job of allJobs) {
      const jobData = job.data as { campaignId?: number }
      if (jobData.campaignId === campaignId && job.name === 'send') {
        await job.remove()
        removedCount++
      }
    }

    const pendingMessages = messages.getForCampaign(campaignId).filter(m => m.status === 'pending')
    for (const message of pendingMessages) {
      messages.updateStatus(message.id, 'cancelled', { error: 'Campaign aborted by user' })
    }

    campaigns.update(campaignId, { status: 'cancelled' })

    return NextResponse.json({ 
      success: true, 
      removedJobs: removedCount,
      cancelledMessages: pendingMessages.length 
    })
  } catch (error) {
    console.error('Error aborting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to abort campaign' },
      { status: 500 }
    )
  }
}
