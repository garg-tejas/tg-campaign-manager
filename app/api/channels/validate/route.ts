import { NextRequest, NextResponse } from 'next/server'
import { validateChannelAccess } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegram_id } = body

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'telegram_id is required' },
        { status: 400 }
      )
    }

    const result = await validateChannelAccess(telegram_id)

    if (result.valid) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error validating channel:', error)
    return NextResponse.json(
      { error: 'Failed to validate channel' },
      { status: 500 }
    )
  }
}
