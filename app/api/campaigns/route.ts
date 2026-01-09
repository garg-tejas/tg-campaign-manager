import { NextRequest, NextResponse } from 'next/server'
import { campaigns, messages } from '@/lib/queries'
import { campaignQueue } from '@/lib/queue'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let allCampaigns
    if (status && status !== 'all') {
      allCampaigns = campaigns.getByStatus(status)
    } else {
      allCampaigns = campaigns.getAll()
    }

    // Add channel count and message stats for each campaign
    const campaignsWithStats = allCampaigns.map(campaign => {
      const channelList = campaigns.getChannels(campaign.id)
      const statusCounts = messages.getStatusCounts(campaign.id)
      return {
        ...campaign,
        channel_count: channelList.length,
        message_stats: statusCounts,
      }
    })

    return NextResponse.json({ campaigns: campaignsWithStats })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const title = formData.get('title') as string
    const text = formData.get('text') as string
    const contentType = formData.get('contentType') as string || 'text'
    const channelIdsStr = formData.get('channelIds') as string
    const parseMode = formData.get('parseMode') as string || 'HTML'
    const disablePreview = formData.get('disablePreview') === 'true'
    const disableNotification = formData.get('disableNotification') === 'true'
    const scheduleAt = formData.get('scheduleAt') as string | null
    const isDryRun = formData.get('isDryRun') === 'true'
    const mediaFile = formData.get('media') as File | null

    if (!title || !text) {
      return NextResponse.json(
        { error: 'Title and text are required' },
        { status: 400 }
      )
    }

    const channelIds = channelIdsStr ? JSON.parse(channelIdsStr) as number[] : []

    if (channelIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one channel must be selected' },
        { status: 400 }
      )
    }

    let mediaPath: string | null = null
    let mediaFilename: string | null = null
    let mediaMimetype: string | null = null

    if (mediaFile && mediaFile.size > 0) {
      const mediaDir = path.join(process.cwd(), 'data', 'media')
      if (!existsSync(mediaDir)) {
        await mkdir(mediaDir, { recursive: true })
      }

      const ext = mediaFile.name.split('.').pop() || ''
      const filename = `${randomUUID()}.${ext}`
      mediaPath = path.join('data', 'media', filename)
      mediaFilename = mediaFile.name
      mediaMimetype = mediaFile.type

      const buffer = Buffer.from(await mediaFile.arrayBuffer())
      await writeFile(path.join(process.cwd(), mediaPath), buffer)
    }

    const campaignId = campaigns.create({
      title,
      text,
      content_type: contentType,
      media_path: mediaPath,
      media_filename: mediaFilename,
      media_mimetype: mediaMimetype,
      parse_mode: parseMode,
      disable_preview: disablePreview ? 1 : 0,
      disable_notification: disableNotification ? 1 : 0,
      status: scheduleAt ? 'scheduled' : 'sending',
      scheduled_at: scheduleAt || null,
    })

    try {
      campaigns.setChannels(campaignId, channelIds)
    } catch (error) {
      // If channel validation fails, delete the campaign we just created
      campaigns.delete(campaignId)
      const errorMessage = error instanceof Error ? error.message : 'Invalid channel IDs'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const channelsToProcess = isDryRun ? [channelIds[0]] : channelIds

    for (const channelId of channelsToProcess) {
      messages.create({
        campaign_id: campaignId,
        channel_id: channelId,
        content_snapshot: text,
        media_snapshot_path: mediaPath,
        status: 'pending',
      })
    }

    const delayMs = scheduleAt ? new Date(scheduleAt).getTime() - Date.now() : 0

    for (const channelId of channelsToProcess) {
      await campaignQueue.add(
        'send',
        { campaignId, channelId },
        {
          delay: delayMs > 0 ? delayMs : 0,
          jobId: `send-${campaignId}-${channelId}`,
        }
      )
    }

    const campaign = campaigns.getById(campaignId)

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
