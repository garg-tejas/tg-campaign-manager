'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import FormattingToolbar from '@/components/FormattingToolbar'
import FormattingGuide from '@/components/FormattingGuide'
import MessagePreview from '@/components/MessagePreview'

interface Channel {
  id: number
  telegram_id: string
  name: string
  is_active: number
  message_count: number
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [contentType, setContentType] = useState<'text' | 'photo' | 'video' | 'document'>('text')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [selectedChannels, setSelectedChannels] = useState<number[]>([])
  const [parseMode, setParseMode] = useState<'HTML' | 'Markdown' | 'MarkdownV2'>('HTML')
  const [disablePreview, setDisablePreview] = useState(false)
  const [disableNotification, setDisableNotification] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels')
      const data = await res.json()
      setChannels((data.channels || []).filter((c: Channel) => c.is_active))
    } catch (err) {
      console.error('Failed to fetch channels:', err)
    }
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMediaFile(file)

    if (file.type.startsWith('image/')) {
      setContentType('photo')
    } else if (file.type.startsWith('video/')) {
      setContentType('video')
    } else {
      setContentType('document')
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setMediaPreview(null)
    }
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setContentType('text')
  }

  const toggleChannel = (id: number) => {
    setSelectedChannels(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    )
  }

  const selectAllChannels = () => {
    setSelectedChannels(channels.map(c => c.id))
  }

  const deselectAllChannels = () => {
    setSelectedChannels([])
  }

  const getScheduleDateTime = (): string | null => {
    if (!scheduleEnabled || !scheduleDate || !scheduleTime) return null
    // Parse as IST (UTC+5:30) - append the offset to make it timezone-aware
    return new Date(`${scheduleDate}T${scheduleTime}:00+05:30`).toISOString()
  }

  const handleSubmit = async (isDryRun: boolean = false) => {
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('text', text)
      formData.append('contentType', contentType)
      formData.append('parseMode', parseMode)
      formData.append('disablePreview', String(disablePreview))
      formData.append('disableNotification', String(disableNotification))
      formData.append('channelIds', JSON.stringify(selectedChannels))
      formData.append('isDryRun', String(isDryRun))

      const scheduleAt = getScheduleDateTime()
      if (scheduleAt) {
        formData.append('scheduleAt', scheduleAt)
      }

      if (mediaFile) {
        formData.append('media', mediaFile)
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create campaign')
      }

      const data = await res.json()
      router.push(`/campaigns/${data.campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = title.trim() && text.trim()
  const canProceedStep2 = selectedChannels.length > 0
  const canSubmit = canProceedStep1 && canProceedStep2

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Campaign</h1>
        <p className="text-slate-400 mt-1">Set up a new promotional campaign</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}
          >
            <button
              onClick={() => setStep(s)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${step === s
                ? 'bg-purple-600 text-white'
                : step > s
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-400'
                }`}
            >
              {step > s ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </button>
            {s < 3 && (
              <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-green-600' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Step 1: Content */}
      {step === 1 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold">Content</h2>

          <Input
            label="Campaign Title"
            placeholder="e.g., Diwali Promo 2024"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Message Text
            </label>
            <FormattingToolbar
              textareaRef={textareaRef}
              parseMode={parseMode}
              onInsert={(newText) => setText(newText)}
            />
            <Textarea
              ref={textareaRef}
              placeholder="Write your promotional message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-slate-500 mt-1">{text.length} characters</p>
          </div>

          <FormattingGuide parseMode={parseMode} />

          {parseMode === 'MarkdownV2' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-400 font-medium text-sm">MarkdownV2 Warning</p>
                  <p className="text-yellow-300/80 text-xs mt-1">
                    MarkdownV2 requires escaping special characters (. ! - ( ) [ ] {'{ }'} {'>'} # + = | ~ `).
                    For easier formatting, consider using <strong>HTML mode</strong> instead.
                  </p>
                </div>
              </div>
            </div>
          )}

          {parseMode === 'Markdown' && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-blue-400 font-medium text-sm">Markdown Mode</p>
                  <p className="text-blue-300/80 text-xs mt-1">
                    Markdown mode has limited support (no underline, strikethrough, spoiler).
                    For full formatting options, use <strong>HTML mode</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <MessagePreview
            text={text}
            parseMode={parseMode}
            mediaPreview={mediaPreview}
            contentType={contentType}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Media (optional)
            </label>
            {mediaFile ? (
              <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
                {mediaPreview && (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-white">{mediaFile.name}</p>
                  <p className="text-sm text-slate-400">
                    {(mediaFile.size / 1024 / 1024).toFixed(2)} MB • {contentType}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveMedia}
                    className="mt-2 text-red-400"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-slate-400">Click to upload or drag and drop</span>
                <span className="text-xs text-slate-500 mt-1">Images, videos, or documents</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleMediaChange}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Parse Mode
              </label>
              <select
                value={parseMode}
                onChange={(e) => setParseMode(e.target.value as typeof parseMode)}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="HTML">HTML</option>
                <option value="Markdown">Markdown</option>
                <option value="MarkdownV2">MarkdownV2</option>
              </select>
            </div>
            <div className="space-y-3 pt-7">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disablePreview}
                  onChange={(e) => setDisablePreview(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-300">Disable link preview</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disableNotification}
                  onChange={(e) => setDisableNotification(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-300">Silent message</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
              Next: Select Channels
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Channels */}
      {step === 2 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Select Channels</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllChannels}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAllChannels}>
                Deselect All
              </Button>
            </div>
          </div>

          {channels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No active channels available.</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => router.push('/channels')}
              >
                Add Channels
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {channels.map((channel) => (
                <label
                  key={channel.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${selectedChannels.includes(channel.id)
                    ? 'bg-purple-600/10 border-purple-500/50'
                    : 'bg-slate-900/30 border-slate-700/50 hover:border-slate-600'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel.id)}
                    onChange={() => toggleChannel(channel.id)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">{channel.name}</p>
                    <p className="text-sm text-slate-400">{channel.telegram_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">{channel.message_count} messages sent</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-400">
            {selectedChannels.length} of {channels.length} channels selected
          </p>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
              Next: Schedule & Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule & Review */}
      {step === 3 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold">Schedule & Review</h2>

          {/* Schedule Options */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={!scheduleEnabled}
                onChange={() => setScheduleEnabled(false)}
                className="w-4 h-4 border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-slate-300">Send immediately</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={scheduleEnabled}
                onChange={() => setScheduleEnabled(true)}
                className="w-4 h-4 border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-slate-300">Schedule for later</span>
            </label>

            {scheduleEnabled && (
              <div className="ml-7 space-y-3">
                <div className="flex gap-4">
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <p className="text-xs text-obsidian-400 font-mono">
                  Timezone: IST (UTC+5:30)
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-300">Final Preview</h3>
            <MessagePreview
              text={text}
              parseMode={parseMode}
              mediaPreview={mediaPreview}
              contentType={contentType}
            />
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">
                Campaign: <span className="text-white font-medium">{title}</span>
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Will be sent to <span className="text-white font-medium">{selectedChannels.length}</span> channel{selectedChannels.length !== 1 ? 's' : ''}
                {scheduleEnabled && scheduleDate && scheduleTime && (
                  <> on <span className="text-white font-medium">{scheduleDate} at {scheduleTime}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => handleSubmit(true)}
                loading={loading}
                disabled={!canSubmit}
              >
                Test Send (1 Channel)
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                loading={loading}
                disabled={!canSubmit || (scheduleEnabled && (!scheduleDate || !scheduleTime))}
              >
                {scheduleEnabled ? 'Schedule Campaign' : 'Send Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
