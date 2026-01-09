import { NextRequest, NextResponse } from 'next/server'
import { campaigns, messages } from '@/lib/queries'
import { campaignQueue } from '@/lib/queue'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const campaign = campaigns.getById(parseInt(id))

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const channelList = campaigns.getChannels(campaign.id)
    const messageList = messages.getForCampaign(campaign.id)
    const statusCounts = messages.getStatusCounts(campaign.id)

    return NextResponse.json({
      campaign: {
        ...campaign,
        channels: channelList,
        messages: messageList,
        message_stats: statusCounts,
      }
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const campaign = campaigns.getById(parseInt(id))
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only edit draft campaigns' },
        { status: 400 }
      )
    }

    campaigns.update(parseInt(id), body)

    const updated = campaigns.getById(parseInt(id))
    return NextResponse.json({ campaign: updated })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const campaign = campaigns.getById(parseInt(id))

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status === 'scheduled') {
      const jobs = await campaignQueue.getDelayed()
      for (const job of jobs) {
        if (job.data.campaignId === parseInt(id)) {
          await job.remove()
        }
      }
    }

    campaigns.delete(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
