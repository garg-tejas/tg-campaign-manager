import { Queue } from 'bullmq'

// Redis connection config for BullMQ
const connectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
}

// Campaign queue for send/delete/reply jobs
export const campaignQueue = new Queue('campaigns', {
  connection: connectionConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  }
})

// Job data types
export interface SendJobData {
  campaignId: number
  channelId: number
}

export interface DeleteJobData {
  campaignId: number
  channelId: number
}

export interface ReplyJobData {
  campaignId: number
  channelId: number
  replyText: string
}

export type JobData = SendJobData | DeleteJobData | ReplyJobData

// Export connection config for worker
export { connectionConfig }
