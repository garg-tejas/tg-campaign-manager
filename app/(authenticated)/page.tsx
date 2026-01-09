'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import StatusBadge from '@/components/StatusBadge'

interface DashboardStats {
  totalCampaigns: number
  activeChannels: number
  messagesToday: number
  scheduledCampaigns: number
}

interface Campaign {
  id: number
  title: string
  status: string
  created_at: string
}

interface Channel {
  id: number
  name: string
  telegram_id: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
  const [channelsWithErrors, setChannelsWithErrors] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data.stats)
        setRecentCampaigns(data.recentCampaigns || [])
        setChannelsWithErrors(data.channelsWithErrors || [])
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl border-2 border-cyan-glow/30 border-t-cyan-glow animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-xl bg-cyan-glow/10 blur-xl" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Campaigns',
      value: stats?.totalCampaigns || 0,
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
      color: 'cyan',
      delay: 'stagger-1',
    },
    {
      label: 'Active Channels',
      value: stats?.activeChannels || 0,
      icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
      color: 'amber',
      delay: 'stagger-2',
    },
    {
      label: 'Messages Today',
      value: stats?.messagesToday || 0,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'success',
      delay: 'stagger-3',
    },
    {
      label: 'Scheduled',
      value: stats?.scheduledCampaigns || 0,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'amber',
      delay: 'stagger-4',
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'cyan':
        return {
          bg: 'bg-cyan-glow/5',
          border: 'border-cyan-glow/20 hover:border-cyan-glow/40',
          text: 'text-cyan-glow',
          glow: 'shadow-[0_0_30px_rgba(0,240,255,0.1)]',
          icon: 'bg-cyan-glow/10 text-cyan-glow',
        }
      case 'amber':
        return {
          bg: 'bg-amber-glow/5',
          border: 'border-amber-glow/20 hover:border-amber-glow/40',
          text: 'text-amber-glow',
          glow: 'shadow-[0_0_30px_rgba(255,184,0,0.1)]',
          icon: 'bg-amber-glow/10 text-amber-glow',
        }
      case 'success':
        return {
          bg: 'bg-success-glow/5',
          border: 'border-success-glow/20 hover:border-success-glow/40',
          text: 'text-success-glow',
          glow: 'shadow-[0_0_30px_rgba(0,255,136,0.1)]',
          icon: 'bg-success-glow/10 text-success-glow',
        }
      default:
        return {
          bg: 'bg-obsidian-800/50',
          border: 'border-obsidian-700/50',
          text: 'text-obsidian-100',
          glow: '',
          icon: 'bg-obsidian-700 text-obsidian-300',
        }
    }
  }

  return (
    <div className="space-y-8 content-layer">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-mono font-bold text-obsidian-100 tracking-tight">
              Dashboard
            </h1>
            <div className="px-2 py-0.5 rounded bg-cyan-glow/10 border border-cyan-glow/30">
              <span className="text-[10px] font-mono text-cyan-glow tracking-wider uppercase">Live</span>
            </div>
          </div>
          <p className="text-obsidian-400 font-mono text-sm">
            Welcome to your campaign command center
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const colors = getColorClasses(stat.color)
          return (
            <div
              key={stat.label}
              className={`
                relative overflow-hidden rounded-xl p-6
                ${colors.bg} ${colors.border} ${colors.glow}
                border backdrop-blur-sm
                transition-all duration-500 card-hover
                animate-fade-in ${stat.delay}
              `}
            >
              {/* Background Accent */}
              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${colors.bg} blur-3xl opacity-50`} />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-obsidian-400 text-xs font-mono tracking-wider uppercase mb-2">
                    {stat.label}
                  </p>
                  <p className={`text-4xl font-mono font-bold ${colors.text} stat-number`} style={{ animationDelay: `${index * 0.1 + 0.3}s` }}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="rounded-xl bg-obsidian-800/30 border border-obsidian-700/50 backdrop-blur-sm animate-fade-in stagger-5">
          <div className="flex items-center justify-between p-6 border-b border-obsidian-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="text-lg font-mono font-semibold text-obsidian-100">Recent Campaigns</h2>
            </div>
            <Link
              href="/campaigns"
              className="text-sm font-mono text-cyan-glow hover:text-cyan-glow/80 transition-colors flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="p-4">
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-xl bg-obsidian-700/50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-obsidian-400 font-mono mb-4">No campaigns yet</p>
                <Link href="/campaigns/new">
                  <Button variant="secondary" size="sm">
                    Create your first campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="
                      flex items-center justify-between p-4 rounded-lg
                      bg-obsidian-900/50 hover:bg-obsidian-700/50
                      border border-transparent hover:border-obsidian-600/50
                      transition-all duration-300 group
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-glow/50" />
                      <div>
                        <p className="font-medium text-obsidian-100 group-hover:text-cyan-glow transition-colors">
                          {campaign.title}
                        </p>
                        <p className="text-xs text-obsidian-500 font-mono">{formatDate(campaign.created_at)}</p>
                      </div>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Channel Health */}
        <div className="rounded-xl bg-obsidian-800/30 border border-obsidian-700/50 backdrop-blur-sm animate-fade-in stagger-6">
          <div className="flex items-center justify-between p-6 border-b border-obsidian-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-glow/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h2 className="text-lg font-mono font-semibold text-obsidian-100">Channel Health</h2>
            </div>
            <Link
              href="/channels"
              className="text-sm font-mono text-cyan-glow hover:text-cyan-glow/80 transition-colors flex items-center gap-1"
            >
              Manage
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="p-4">
            {channelsWithErrors.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-xl bg-success-glow/20 blur-xl" />
                  <div className="relative w-16 h-16 rounded-xl bg-success-glow/10 border border-success-glow/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-success-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-success-glow font-mono font-medium mb-1">All channels healthy</p>
                <p className="text-obsidian-500 text-sm font-mono">No permission errors detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-danger-glow/5 border border-danger-glow/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-danger-glow shadow-[0_0_8px_rgba(255,51,102,0.8)]" />
                    <p className="text-sm font-mono text-danger-glow">
                      {channelsWithErrors.length} channel(s) have permission errors
                    </p>
                  </div>
                </div>
                {channelsWithErrors.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-obsidian-900/50 border border-obsidian-700/50"
                  >
                    <div>
                      <p className="font-medium text-obsidian-100">{channel.name}</p>
                      <p className="text-xs text-obsidian-500 font-mono">{channel.telegram_id}</p>
                    </div>
                    <StatusBadge status="failed" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-obsidian-800/30 border border-obsidian-700/50 backdrop-blur-sm p-6 animate-fade-in stagger-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-obsidian-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-obsidian-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-mono font-semibold text-obsidian-100">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/campaigns/new"
            className="
              group relative overflow-hidden flex items-center gap-4 p-5 rounded-xl
              bg-obsidian-900/50 hover:bg-cyan-glow/5
              border border-obsidian-700/50 hover:border-cyan-glow/30
              transition-all duration-300 card-hover
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-glow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-12 h-12 rounded-xl bg-cyan-glow/10 group-hover:bg-cyan-glow/20 flex items-center justify-center transition-all duration-300">
              <svg className="w-6 h-6 text-cyan-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="relative">
              <p className="font-mono font-medium text-obsidian-100 group-hover:text-cyan-glow transition-colors">
                New Campaign
              </p>
              <p className="text-sm text-obsidian-500 font-mono">Create a new promo</p>
            </div>
          </Link>

          <Link
            href="/channels"
            className="
              group relative overflow-hidden flex items-center gap-4 p-5 rounded-xl
              bg-obsidian-900/50 hover:bg-amber-glow/5
              border border-obsidian-700/50 hover:border-amber-glow/30
              transition-all duration-300 card-hover
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-glow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-12 h-12 rounded-xl bg-amber-glow/10 group-hover:bg-amber-glow/20 flex items-center justify-center transition-all duration-300">
              <svg className="w-6 h-6 text-amber-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="relative">
              <p className="font-mono font-medium text-obsidian-100 group-hover:text-amber-glow transition-colors">
                Add Channel
              </p>
              <p className="text-sm text-obsidian-500 font-mono">Connect a new channel</p>
            </div>
          </Link>

          <Link
            href="/campaigns"
            className="
              group relative overflow-hidden flex items-center gap-4 p-5 rounded-xl
              bg-obsidian-900/50 hover:bg-success-glow/5
              border border-obsidian-700/50 hover:border-success-glow/30
              transition-all duration-300 card-hover
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-success-glow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-12 h-12 rounded-xl bg-success-glow/10 group-hover:bg-success-glow/20 flex items-center justify-center transition-all duration-300">
              <svg className="w-6 h-6 text-success-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="relative">
              <p className="font-mono font-medium text-obsidian-100 group-hover:text-success-glow transition-colors">
                View Analytics
              </p>
              <p className="text-sm text-obsidian-500 font-mono">Campaign performance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
