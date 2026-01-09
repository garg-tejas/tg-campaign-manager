import { NextResponse } from 'next/server'
import { stats } from '@/lib/queries'

export async function GET() {
  try {
    const dashboardStats = stats.getDashboardStats()
    const recentCampaigns = stats.getRecentCampaigns(5)
    const channelsWithErrors = stats.getChannelsWithErrors()

    return NextResponse.json({
      stats: dashboardStats,
      recentCampaigns,
      channelsWithErrors,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
