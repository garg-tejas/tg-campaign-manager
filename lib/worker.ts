import { Worker, Job } from 'bullmq'
import { connectionConfig, SendJobData, DeleteJobData, ReplyJobData } from './queue'
import { campaigns, channels, messages } from './queries'
import {
  sendTextMessage,
  sendPhoto,
  sendVideo,
  sendDocument,
  deleteMessage,
  SendMessageOptions,
} from './telegram'
import { readFile } from 'fs/promises'
import path from 'path'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function getErrorType(error: Error): 'rate_limit' | 'permissions' | 'network' | 'unknown' {
  const msg = error.message.toLowerCase()
  if (msg.includes('too many requests') || msg.includes('retry after')) return 'rate_limit'
  if (msg.includes('not enough rights') || msg.includes('kicked') || msg.includes('forbidden') || msg.includes('chat not found')) return 'permissions'
  if (msg.includes('network') || msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('enotfound')) return 'network'
  return 'unknown'
}

function getRetryAfter(error: Error & { response?: { parameters?: { retry_after?: number } } }): number | null {
  return error.response?.parameters?.retry_after ?? null
}

async function handleSend(data: SendJobData): Promise<void> {
  const { campaignId, channelId } = data

  const message = messages.getByCampaignAndChannel(campaignId, channelId)
  if (!message) {
    console.log(`No message record found for campaign ${campaignId}, channel ${channelId}`)
    return
  }

  if (message.status === 'cancelled') {
    console.log(`Message cancelled for campaign ${campaignId}, channel ${channelId}`)
    return
  }

  const campaign = campaigns.getById(campaignId)
  const channel = channels.getById(channelId)

  if (!campaign || !channel) {
    console.error(`Campaign or channel not found: campaign=${campaignId}, channel=${channelId}`)
    return
  }

  // Rate limit: 400ms between messages per channel
  if (channel.last_message_sent_at) {
    const timeSinceLastSend = Date.now() - new Date(channel.last_message_sent_at).getTime()
    if (timeSinceLastSend < 400) {
      await sleep(400 - timeSinceLastSend)
    }
  }

  try {
    const options: SendMessageOptions = {
      parseMode: campaign.parse_mode as SendMessageOptions['parseMode'],
      disablePreview: Boolean(campaign.disable_preview),
      disableNotification: Boolean(campaign.disable_notification),
    }

    let sentMessage

    if (campaign.media_path && campaign.content_type !== 'text') {
      const mediaBuffer = await readFile(path.join(process.cwd(), campaign.media_path))

      switch (campaign.content_type) {
        case 'photo':
          sentMessage = await sendPhoto(channel.telegram_id, mediaBuffer, campaign.text, options)
          break
        case 'video':
          sentMessage = await sendVideo(channel.telegram_id, mediaBuffer, campaign.text, options)
          break
        case 'document':
          sentMessage = await sendDocument(channel.telegram_id, mediaBuffer, campaign.text, options)
          break
        default:
          sentMessage = await sendTextMessage(channel.telegram_id, campaign.text, options)
      }
    } else {
      sentMessage = await sendTextMessage(channel.telegram_id, campaign.text, options)
    }

    messages.updateStatus(message.id, 'sent', {
      telegram_message_id: sentMessage.message_id.toString(),
    })

    channels.updateLastMessageSent(channel.id)
    console.log(`SUCCESS: Sent to channel ${channel.name} (${channel.telegram_id})`)

    const pendingCount = messages.getPendingCount(campaignId)
    if (pendingCount === 0) {
      const statusCounts = messages.getStatusCounts(campaignId)
      const sentCount = statusCounts['sent'] || 0

      if (sentCount > 0) {
        campaigns.update(campaignId, { status: 'completed' })
        console.log(`SUCCESS: Campaign ${campaignId} completed`)
      } else {
        campaigns.update(campaignId, { status: 'failed' })
        console.log(`FAILED: Campaign ${campaignId} failed (all channels failed)`)
      }
    }

  } catch (err) {
    const error = err as Error & { response?: { parameters?: { retry_after?: number } } }
    console.error(`FAILED: Failed to send to channel ${channel.name}:`, error.message)

    const errorType = getErrorType(error)
    const retryAfter = getRetryAfter(error)

    messages.updateStatus(message.id, 'failed', {
      error: error.message,
      error_type: errorType,
    })

    // Auto-disable channel on permission errors
    if (errorType === 'permissions') {
      channels.update(channel.id, { is_active: 0 })
      console.log(`WARN: Disabled channel ${channel.name} due to permissions error`)
    }

    const pendingCount = messages.getPendingCount(campaignId)
    if (pendingCount === 0) {
      const statusCounts = messages.getStatusCounts(campaignId)
      const sentCount = statusCounts['sent'] || 0

      if (sentCount > 0) {
        campaigns.update(campaignId, { status: 'completed' })
        console.log(`SUCCESS: Campaign ${campaignId} completed (some channels succeeded)`)
      } else {
        campaigns.update(campaignId, { status: 'failed' })
        console.log(`FAILED: Campaign ${campaignId} failed (all channels failed)`)
      }
    }

    // Retry on rate_limit/network errors only
    if (errorType === 'rate_limit' || errorType === 'network') {
      if (retryAfter) {
        throw new Error(`RATE_LIMITED:${retryAfter * 1000}`)
      }
      throw error
    }
  }
}

async function handleDelete(data: DeleteJobData): Promise<void> {
  const { campaignId, channelId } = data

  const message = messages.getByCampaignAndChannel(campaignId, channelId)
  if (!message || message.status !== 'sent') {
    console.log(`No sent message to delete for campaign ${campaignId}, channel ${channelId}`)
    return
  }

  const channel = channels.getById(channelId)
  if (!channel) {
    console.error(`Channel not found: ${channelId}`)
    return
  }

  try {
    await deleteMessage(channel.telegram_id, parseInt(message.telegram_message_id!))
    messages.updateStatus(message.id, 'deleted')
    console.log(`SUCCESS: Deleted message from channel ${channel.name}`)

    const childMessages = messages.getChildMessages(message.id)
    let deletedReplies = 0

    for (const childMessage of childMessages) {
      if (childMessage.telegram_message_id) {
        try {
          await deleteMessage(channel.telegram_id, parseInt(childMessage.telegram_message_id))
          messages.updateStatus(childMessage.id, 'deleted')
          deletedReplies++
        } catch (childErr) {
          const childError = childErr as Error
          if (childError.message.includes('message to delete not found') || childError.message.includes("message can't be deleted")) {
            messages.updateStatus(childMessage.id, 'deleted')
            deletedReplies++
          } else {
            console.error(`WARN: Failed to delete reply ${childMessage.id} from channel ${channel.name}:`, childError.message)
            messages.updateStatus(childMessage.id, 'delete_failed', { error: childError.message })
          }
        }
      }
    }

    if (deletedReplies > 0) {
      console.log(`SUCCESS: Deleted ${deletedReplies} reply(ies) from channel ${channel.name}`)
    }
  } catch (err) {
    const error = err as Error

    if (error.message.includes('message to delete not found') || error.message.includes("message can't be deleted")) {
      messages.updateStatus(message.id, 'deleted')
      console.log(`SUCCESS: Message already deleted in channel ${channel.name}`)

      const childMessages = messages.getChildMessages(message.id)
      for (const childMessage of childMessages) {
        if (childMessage.telegram_message_id) {
          try {
            await deleteMessage(channel.telegram_id, parseInt(childMessage.telegram_message_id))
            messages.updateStatus(childMessage.id, 'deleted')
          } catch {
            // Ignore - parent already deleted
          }
        }
      }
    } else {
      console.error(`FAILED: Failed to delete from channel ${channel.name}:`, error.message)
      messages.updateStatus(message.id, 'delete_failed', { error: error.message })
      throw error
    }
  }

  await sleep(300)
}

async function handleReply(data: ReplyJobData): Promise<void> {
  const { campaignId, channelId, replyText } = data

  const originalMessage = messages.getByCampaignAndChannel(campaignId, channelId)
  if (!originalMessage || originalMessage.status !== 'sent') {
    throw new Error(`Original message not found for campaign ${campaignId}, channel ${channelId}`)
  }

  const channel = channels.getById(channelId)
  const campaign = campaigns.getById(campaignId)

  if (!channel || !campaign) {
    throw new Error(`Channel or campaign not found`)
  }

  try {
    const options: SendMessageOptions = {
      parseMode: campaign.parse_mode as SendMessageOptions['parseMode'],
      replyToMessageId: parseInt(originalMessage.telegram_message_id!),
    }
    const replyMessage = await sendTextMessage(channel.telegram_id, replyText, options)

    messages.create({
      campaign_id: campaignId,
      channel_id: channelId,
      content_snapshot: replyText,
      parent_message_id: originalMessage.id,
      status: 'sent',
    })

    const newMessages = messages.getForCampaign(campaignId)
    const replyRecord = newMessages.find(m =>
      m.channel_id === channelId &&
      m.parent_message_id === originalMessage.id &&
      m.status === 'sent'
    )
    if (replyRecord) {
      messages.updateStatus(replyRecord.id, 'sent', {
        telegram_message_id: replyMessage.message_id.toString(),
      })
    }

    console.log(`SUCCESS: Sent reply to channel ${channel.name}`)
  } catch (err) {
    const error = err as Error
    console.error(`FAILED: Failed to reply in channel ${channel.name}:`, error.message)
    throw error
  }

  await sleep(300)
}

export function createWorker(): Worker {
  const worker = new Worker(
    'campaigns',
    async (job: Job) => {
      console.log(`Processing job ${job.name} (${job.id})`)

      switch (job.name) {
        case 'send':
          return await handleSend(job.data as SendJobData)
        case 'delete':
          return await handleDelete(job.data as DeleteJobData)
        case 'reply':
          return await handleReply(job.data as ReplyJobData)
        default:
          console.warn(`Unknown job type: ${job.name}`)
      }
    },
    {
      connection: connectionConfig,
      concurrency: 1,
      limiter: {
        max: 1,
        duration: 400,
      },
    }
  )

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
  })

  return worker
}

let worker: Worker | null = null

export function startWorker(): Worker {
  if (!worker) {
    worker = createWorker()
    console.log('🚀 Campaign worker started')
  }
  return worker
}

export function stopWorker(): void {
  if (worker) {
    worker.close()
    worker = null
    console.log('🛑 Campaign worker stopped')
  }
}
