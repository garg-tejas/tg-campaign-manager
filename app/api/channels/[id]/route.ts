import { NextRequest, NextResponse } from 'next/server'
import { channels } from '@/lib/queries'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const channel = channels.getById(parseInt(id))

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    return NextResponse.json({
      channel: {
        ...channel,
        message_count: channels.getMessageCount(channel.id),
      }
    })
  } catch (error) {
    console.error('Error fetching channel:', error)
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, is_active } = body

    const channel = channels.getById(parseInt(id))
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    channels.update(parseInt(id), {
      name: name !== undefined ? name : undefined,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : undefined,
    })

    const updated = channels.getById(parseInt(id))
    return NextResponse.json({ channel: updated })
  } catch (error) {
    console.error('Error updating channel:', error)
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const channel = channels.getById(parseInt(id))

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    channels.delete(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting channel:', error)
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 })
  }
}
