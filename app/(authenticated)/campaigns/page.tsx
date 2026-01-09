'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import StatusBadge from '@/components/StatusBadge'
import { ConfirmModal } from '@/components/Modal'

interface Campaign {
  id: number
  title: string
  content_type: string
  text: string
  status: string
  scheduled_at: string | null
  created_at: string
  channel_count: number
  message_stats: Record<string, number>
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns?status=${statusFilter}`)
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMessageProgress = (stats: Record<string, number>) => {
    const sent = stats.sent || 0
    const pending = stats.pending || 0
    const failed = stats.failed || 0
    const total = sent + pending + failed
    if (total === 0) return { sent: 0, pending: 0, failed: 0, total: 0, percentage: 0 }
    return {
      sent,
      pending,
      failed,
      total,
      percentage: Math.round((sent / total) * 100),
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, campaign: Campaign) => {
    e.preventDefault()
    e.stopPropagation()
    setCampaignToDelete(campaign)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete campaign')

      setDeleteModalOpen(false)
      setCampaignToDelete(null)
      await fetchCampaigns()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete campaign. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-slate-400 mt-1">Manage your promotional campaigns</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2">
        {['all', 'draft', 'scheduled', 'sending', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <svg className="w-12 h-12 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-1">No campaigns yet</h3>
          <p className="text-slate-500 mb-4">Create your first campaign to get started</p>
          <Link href="/campaigns/new">
            <Button>Create Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const progress = getMessageProgress(campaign.message_stats)
            return (
              <div
                key={campaign.id}
                className="relative bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 hover:border-purple-500/50 transition-all group"
              >
                <Link href={`/campaigns/${campaign.id}`} className="block">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{campaign.title}</h3>
                        <StatusBadge status={campaign.status} />
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {campaign.text.substring(0, 150)}
                        {campaign.text.length > 150 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          {campaign.channel_count} channels
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {campaign.scheduled_at
                            ? `Scheduled: ${formatDate(campaign.scheduled_at)}`
                            : formatDate(campaign.created_at)}
                        </span>
                      </div>
                    </div>
                    {progress.total > 0 && (
                      <div className="ml-6 text-right">
                        <p className="text-2xl font-bold text-white">{progress.percentage}%</p>
                        <p className="text-sm text-slate-400">
                          {progress.sent}/{progress.total} sent
                        </p>
                        {progress.failed > 0 && (
                          <p className="text-sm text-red-400">{progress.failed} failed</p>
                        )}
                      </div>
                    )}
                  </div>
                  {progress.total > 0 && (
                    <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}
                </Link>
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteClick(e, campaign)}
                  className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete campaign"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setCampaignToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Campaign"
        message={
          campaignToDelete
            ? `Are you sure you want to delete "${campaignToDelete.title}"? This will permanently delete the campaign and all associated messages. This action cannot be undone.`
            : ''
        }
        confirmText="Delete Campaign"
        loading={deleting}
        variant="danger"
      />
    </div>
  )
}
