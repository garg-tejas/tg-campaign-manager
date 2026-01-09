'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import StatusBadge from '@/components/StatusBadge'
import Textarea from '@/components/Textarea'
import { ConfirmModal } from '@/components/Modal'

interface Channel {
  id: number
  telegram_id: string
  name: string
}

interface Message {
  id: number
  campaign_id: number
  channel_id: number
  telegram_message_id: string | null
  parent_message_id: number | null
  content_snapshot: string
  status: string
  error: string | null
  error_type: string | null
  sent_at: string | null
  deleted_at: string | null
  channel_name: string
}

interface Campaign {
  id: number
  title: string
  content_type: string
  text: string
  media_path: string | null
  media_filename: string | null
  parse_mode: string
  status: string
  scheduled_at: string | null
  created_at: string
  channels: Channel[]
  messages: Message[]
  message_stats: Record<string, number>
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMessages, setSelectedMessages] = useState<number[]>([])
  const [replyText, setReplyText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`)
      if (!res.ok) {
        router.push('/campaigns')
        return
      }
      const data = await res.json()
      setCampaign(data.campaign)
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchCampaign()
    const interval = setInterval(() => {
      if (campaign?.status === 'sending' || campaign?.status === 'scheduled') {
        fetchCampaign()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchCampaign, campaign?.status])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' IST'
  }

  const getFilteredMessages = () => {
    if (!campaign) return []
    const rootMessages = campaign.messages.filter(m => !m.parent_message_id)
    if (statusFilter === 'all') return rootMessages
    return rootMessages.filter(m => m.status === statusFilter)
  }

  const toggleMessage = (channelId: number) => {
    setSelectedMessages(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const selectAllFiltered = () => {
    const filtered = getFilteredMessages()
    setSelectedMessages(filtered.map(m => m.channel_id))
  }

  const deselectAll = () => {
    setSelectedMessages([])
  }

  const handleDeleteSelected = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds: selectedMessages }),
      })
      if (!res.ok) throw new Error('Failed to queue delete')
      setDeleteModalOpen(false)
      setSelectedMessages([])
      await fetchCampaign()
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReplySelected = async () => {
    if (!replyText.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelIds: selectedMessages,
          replyText: replyText.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to queue reply')
      setReplyText('')
      setSelectedMessages([])
      await fetchCampaign()
    } catch (error) {
      console.error('Reply failed:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSchedule = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/schedule`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to cancel schedule')
      setCancelModalOpen(false)
      await fetchCampaign()
    } catch (error) {
      console.error('Cancel failed:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!campaign) {
    return <div>Campaign not found</div>
  }

  const filteredMessages = getFilteredMessages()
  const sentMessages = filteredMessages.filter(m => m.status === 'sent')
  const selectedSentCount = selectedMessages.filter(id =>
    sentMessages.some(m => m.channel_id === id)
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-slate-400">
            Created {formatDate(campaign.created_at)}
            {campaign.scheduled_at && ` • Scheduled for ${formatDate(campaign.scheduled_at)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'scheduled' && (
            <Button variant="danger" onClick={() => setCancelModalOpen(true)}>
              Cancel Schedule
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push('/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </div>

      {/* Message Preview */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Message Content</h2>
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          {campaign.media_filename && (
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {campaign.media_filename} ({campaign.content_type})
            </div>
          )}
          <p className="text-white whitespace-pre-wrap">{campaign.text}</p>
        </div>
        <div className="flex gap-4 mt-4 text-sm text-slate-400">
          <span>Parse Mode: {campaign.parse_mode}</span>
          <span>Type: {campaign.content_type}</span>
        </div>
      </div>

      {/* Delivery Status */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Delivery Status</h2>
          <div className="flex gap-2">
            {['all', 'pending', 'sent', 'deleted', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded text-sm transition-all ${statusFilter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                {status} {campaign.message_stats[status] ? `(${campaign.message_stats[status]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedMessages.length > 0 && (
          <div className="flex items-center gap-4 p-4 mb-4 bg-purple-600/10 border border-purple-500/30 rounded-lg">
            <span className="text-sm text-purple-300">
              {selectedMessages.length} channel(s) selected
            </span>
            <div className="flex-1" />
            {selectedSentCount > 0 && (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={actionLoading}
                >
                  Delete Selected ({selectedSentCount})
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAll}
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* Messages Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedMessages.length === filteredMessages.length && filteredMessages.length > 0}
                    onChange={() => {
                      if (selectedMessages.length === filteredMessages.length) {
                        deselectAll()
                      } else {
                        selectAllFiltered()
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-600"
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Channel</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Sent At</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Error</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message) => (
                <tr
                  key={message.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20"
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(message.channel_id)}
                      onChange={() => toggleMessage(message.channel_id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-600"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-white">{message.channel_name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={message.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {formatDate(message.sent_at)}
                  </td>
                  <td className="py-3 px-4">
                    {message.error && (
                      <span
                        className="text-sm text-red-400 cursor-help"
                        title={message.error}
                      >
                        {message.error_type || 'Error'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No messages match the current filter
          </div>
        )}
      </div>

      {/* Reply Section */}
      {sentMessages.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Send Reply</h2>
          <Textarea
            placeholder="Write a follow-up message..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-slate-400">
              {selectedSentCount > 0
                ? `Will reply to ${selectedSentCount} selected channel(s)`
                : 'Select channels above to send a reply'}
            </p>
            <Button
              onClick={handleReplySelected}
              disabled={!replyText.trim() || selectedSentCount === 0 || actionLoading}
              loading={actionLoading}
            >
              Send Reply
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteSelected}
        title="Delete Messages"
        message={`Are you sure you want to delete messages from ${selectedSentCount} channel(s)? This cannot be undone.`}
        confirmText="Delete Messages"
        loading={actionLoading}
      />

      {/* Cancel Schedule Confirmation */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelSchedule}
        title="Cancel Scheduled Campaign"
        message="Are you sure you want to cancel this scheduled campaign? It will be moved back to draft status."
        confirmText="Cancel Schedule"
        loading={actionLoading}
        variant="danger"
      />
    </div>
  )
}
