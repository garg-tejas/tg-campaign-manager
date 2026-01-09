import { NextRequest, NextResponse } from 'next/server'
import { campaigns } from '@/lib/queries'
import { campaignQueue } from '@/lib/queue'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const campaign = campaigns.getById(parseInt(id))

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Campaign is not scheduled' },
        { status: 400 }
      )
    }

    const jobs = await campaignQueue.getDelayed()
    let removedCount = 0

    for (const job of jobs) {
      if (job.data.campaignId === parseInt(id)) {
        await job.remove()
        removedCount++
      }
    }

    campaigns.update(parseInt(id), {
      status: 'draft',
      scheduled_at: null,
    })

    return NextResponse.json({ success: true, removedJobs: removedCount })
  } catch (error) {
    console.error('Error canceling schedule:', error)
    return NextResponse.json(
      { error: 'Failed to cancel schedule' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const campaign = campaigns.getById(parseInt(id))

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const jobs = await campaignQueue.getDelayed()
    const campaignJobs = jobs
      .filter(j => j.data.campaignId === parseInt(id))
      .map(j => ({
        channelId: j.data.channelId,
        scheduledFor: new Date(Date.now() + (j.opts.delay || 0)).toISOString(),
        jobId: j.id,
      }))

    return NextResponse.json({ jobs: campaignJobs })
  } catch (error) {
    console.error('Error fetching scheduled jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled jobs' },
      { status: 500 }
    )
  }
}
