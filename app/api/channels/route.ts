import { NextRequest, NextResponse } from 'next/server'
import { channels } from '@/lib/queries'

export async function GET() {
  try {
    const allChannels = channels.getAll()

    const channelsWithStats = allChannels.map(channel => ({
      ...channel,
      message_count: channels.getMessageCount(channel.id),
    }))

    return NextResponse.json({ channels: channelsWithStats })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, telegram_id } = body

    if (!name || !telegram_id) {
      return NextResponse.json(
        { error: 'Name and telegram_id are required' },
        { status: 400 }
      )
    }

    if (!telegram_id.startsWith('-100')) {
      return NextResponse.json(
        { error: 'Invalid channel ID format. Channel IDs should start with -100' },
        { status: 400 }
      )
    }

    const existing = channels.getByTelegramId(telegram_id)
    if (existing) {
      return NextResponse.json(
        { error: 'Channel with this Telegram ID already exists' },
        { status: 409 }
      )
    }

    const id = channels.create({ name, telegram_id })
    const channel = channels.getById(id)

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}
