'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import StatusBadge from '@/components/StatusBadge'
import Modal, { ConfirmModal } from '@/components/Modal'

interface Channel {
  id: number
  telegram_id: string
  name: string
  is_active: number
  last_message_sent_at: string | null
  created_at: string
  message_count: number
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)

  // Form state
  const [newName, setNewName] = useState('')
  const [newTelegramId, setNewTelegramId] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null)

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels')
      const data = await res.json()
      setChannels(data.channels || [])
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const handleValidate = async () => {
    if (!newTelegramId) {
      setFormError('Please enter a Telegram ID first')
      return
    }

    setValidating(true)
    setValidationResult(null)
    setFormError('')

    try {
      const res = await fetch('/api/channels/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: newTelegramId }),
      })
      const data = await res.json()
      setValidationResult(data)
    } catch {
      setValidationResult({ valid: false, error: 'Failed to validate' })
    } finally {
      setValidating(false)
    }
  }

  const handleAddChannel = async () => {
    if (!newName || !newTelegramId) {
      setFormError('All fields are required')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, telegram_id: newTelegramId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || 'Failed to add channel')
        return
      }

      setAddModalOpen(false)
      setNewName('')
      setNewTelegramId('')
      setValidationResult(null)
      await fetchChannels()
    } catch {
      setFormError('Failed to add channel')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (channel: Channel) => {
    try {
      await fetch(`/api/channels/${channel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !channel.is_active }),
      })
      await fetchChannels()
    } catch (error) {
      console.error('Failed to toggle channel:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedChannel) return

    try {
      await fetch(`/api/channels/${selectedChannel.id}`, {
        method: 'DELETE',
      })
      setDeleteModalOpen(false)
      setSelectedChannel(null)
      await fetchChannels()
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channels</h1>
          <p className="text-slate-400 mt-1">Manage your Telegram channels</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Channel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <svg className="w-12 h-12 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-1">No channels yet</h3>
          <p className="text-slate-500">Add your first Telegram channel to get started</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Name</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Telegram ID</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Messages</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Last Sent</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-medium text-white">{channel.name}</span>
                  </td>
                  <td className="py-4 px-6">
                    <code className="text-sm text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                      {channel.telegram_id}
                    </code>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={channel.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="py-4 px-6 text-slate-300">{channel.message_count}</td>
                  <td className="py-4 px-6 text-slate-400 text-sm">
                    {formatDate(channel.last_message_sent_at)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(channel)}
                      >
                        {channel.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedChannel(channel)
                          setDeleteModalOpen(true)
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Channel Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setNewName('')
          setNewTelegramId('')
          setFormError('')
          setValidationResult(null)
        }}
        title="Add Channel"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setAddModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddChannel} loading={saving}>
              Add Channel
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Channel Name"
            placeholder="My Awesome Channel"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <div className="space-y-2">
            <Input
              label="Telegram Channel ID"
              placeholder="-1001234567890"
              value={newTelegramId}
              onChange={(e) => {
                setNewTelegramId(e.target.value)
                setValidationResult(null)
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleValidate}
                loading={validating}
                disabled={!newTelegramId}
              >
                Validate Access
              </Button>
              {validationResult && (
                <span className={`text-sm ${validationResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {validationResult.valid ? 'Bot has access!' : validationResult.error}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Channel IDs start with -100. Use @getidsbot in Telegram to find yours.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{formError}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedChannel(null)
        }}
        onConfirm={handleDelete}
        title="Delete Channel"
        message={`Are you sure you want to delete "${selectedChannel?.name}"? This will also remove all associated message records.`}
        confirmText="Delete"
      />
    </div>
  )
}
