import db, { Channel, Campaign, Message } from './db'

export const channels = {
  getAll(): Channel[] {
    return db.prepare('SELECT * FROM channels ORDER BY name').all() as Channel[]
  },

  getActive(): Channel[] {
    return db.prepare('SELECT * FROM channels WHERE is_active = 1 ORDER BY name').all() as Channel[]
  },

  getById(id: number): Channel | undefined {
    return db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel | undefined
  },

  getByTelegramId(telegramId: string): Channel | undefined {
    return db.prepare('SELECT * FROM channels WHERE telegram_id = ?').get(telegramId) as Channel | undefined
  },

  create(data: { telegram_id: string; name: string }): number {
    const result = db.prepare(
      'INSERT INTO channels (telegram_id, name) VALUES (?, ?)'
    ).run(data.telegram_id, data.name)
    return result.lastInsertRowid as number
  },

  update(id: number, data: { name?: string; is_active?: number }): void {
    const updates: string[] = []
    const values: (string | number)[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?')
      values.push(data.is_active)
    }

    if (updates.length > 0) {
      values.push(id)
      db.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }
  },

  updateLastMessageSent(id: number): void {
    db.prepare('UPDATE channels SET last_message_sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
  },

  delete(id: number): void {
    db.prepare('DELETE FROM channels WHERE id = ?').run(id)
  },

  getMessageCount(id: number): number {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE channel_id = ? AND status = ?'
    ).get(id, 'sent') as { count: number }
    return result.count
  },
}

export const campaigns = {
  getAll(): Campaign[] {
    return db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all() as Campaign[]
  },

  getByStatus(status: string): Campaign[] {
    return db.prepare('SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC').all(status) as Campaign[]
  },

  getById(id: number): Campaign | undefined {
    return db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Campaign | undefined
  },

  create(data: {
    title: string
    content_type: string
    text: string
    media_path?: string | null
    media_filename?: string | null
    media_mimetype?: string | null
    parse_mode?: string
    disable_preview?: number
    disable_notification?: number
    status?: string
    scheduled_at?: string | null
  }): number {
    const result = db.prepare(`
      INSERT INTO campaigns
      (title, content_type, text, media_path, media_filename, media_mimetype, parse_mode, disable_preview, disable_notification, status, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title,
      data.content_type,
      data.text,
      data.media_path || null,
      data.media_filename || null,
      data.media_mimetype || null,
      data.parse_mode || 'HTML',
      data.disable_preview || 0,
      data.disable_notification || 0,
      data.status || 'draft',
      data.scheduled_at || null
    )
    return result.lastInsertRowid as number
  },

  update(id: number, data: Partial<Campaign>): void {
    const updates: string[] = []
    const values: (string | number | null)[] = []

    const fields: (keyof Campaign)[] = [
      'title', 'content_type', 'text', 'media_path', 'media_filename',
      'media_mimetype', 'parse_mode', 'disable_preview', 'disable_notification',
      'status', 'scheduled_at'
    ]

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(data[field] as string | number | null)
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      db.prepare(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }
  },

  delete(id: number): void {
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(id)
  },

  getChannels(campaignId: number): Channel[] {
    return db.prepare(`
      SELECT c.* FROM channels c
      JOIN campaign_channels cc ON c.id = cc.channel_id
      WHERE cc.campaign_id = ?
      ORDER BY c.name
    `).all(campaignId) as Channel[]
  },

  addChannel(campaignId: number, channelId: number): void {
    db.prepare(
      'INSERT OR IGNORE INTO campaign_channels (campaign_id, channel_id) VALUES (?, ?)'
    ).run(campaignId, channelId)
  },

  removeChannel(campaignId: number, channelId: number): void {
    db.prepare(
      'DELETE FROM campaign_channels WHERE campaign_id = ? AND channel_id = ?'
    ).run(campaignId, channelId)
  },

  setChannels(campaignId: number, channelIds: number[]): void {
    const campaign = this.getById(campaignId)
    if (!campaign) {
      throw new Error(`Campaign with id ${campaignId} does not exist`)
    }

    // Validate all channel IDs exist to prevent foreign key constraint errors
    if (channelIds.length > 0) {
      const placeholders = channelIds.map(() => '?').join(',')
      const existingChannelIds = new Set(
        (db.prepare(`SELECT id FROM channels WHERE id IN (${placeholders})`)
          .all(...channelIds) as Array<{ id: number }>)
          .map((row) => row.id)
      )

      const invalidChannelIds = channelIds.filter(id => !existingChannelIds.has(id))
      if (invalidChannelIds.length > 0) {
        throw new Error(`Invalid channel IDs: ${invalidChannelIds.join(', ')}`)
      }
    }

    const deleteStmt = db.prepare('DELETE FROM campaign_channels WHERE campaign_id = ?')
    const insertStmt = db.prepare('INSERT INTO campaign_channels (campaign_id, channel_id) VALUES (?, ?)')

    db.transaction(() => {
      deleteStmt.run(campaignId)
      for (const channelId of channelIds) {
        insertStmt.run(campaignId, channelId)
      }
    })()
  },
}

export const messages = {
  getForCampaign(campaignId: number): (Message & { channel_name: string })[] {
    return db.prepare(`
      SELECT m.*, c.name as channel_name
      FROM messages m
      JOIN channels c ON m.channel_id = c.id
      WHERE m.campaign_id = ?
      ORDER BY m.created_at
    `).all(campaignId) as (Message & { channel_name: string })[]
  },

  getForChannel(channelId: number): Message[] {
    return db.prepare(
      'SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at DESC'
    ).all(channelId) as Message[]
  },

  getById(id: number): Message | undefined {
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message | undefined
  },

  getByCampaignAndChannel(campaignId: number, channelId: number, parentId: number | null = null): Message | undefined {
    if (parentId === null) {
      return db.prepare(
        'SELECT * FROM messages WHERE campaign_id = ? AND channel_id = ? AND parent_message_id IS NULL'
      ).get(campaignId, channelId) as Message | undefined
    }
    return db.prepare(
      'SELECT * FROM messages WHERE campaign_id = ? AND channel_id = ? AND parent_message_id = ?'
    ).get(campaignId, channelId, parentId) as Message | undefined
  },

  getChildMessages(parentMessageId: number): Message[] {
    return db.prepare(
      'SELECT * FROM messages WHERE parent_message_id = ? ORDER BY created_at'
    ).all(parentMessageId) as Message[]
  },

  create(data: {
    campaign_id: number
    channel_id: number
    content_snapshot: string
    media_snapshot_path?: string | null
    parent_message_id?: number | null
    status?: string
  }): number {
    const result = db.prepare(`
      INSERT INTO messages
      (campaign_id, channel_id, content_snapshot, media_snapshot_path, parent_message_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.campaign_id,
      data.channel_id,
      data.content_snapshot,
      data.media_snapshot_path || null,
      data.parent_message_id || null,
      data.status || 'pending'
    )
    return result.lastInsertRowid as number
  },

  updateStatus(
    id: number,
    status: string,
    extra?: { telegram_message_id?: string; error?: string; error_type?: string }
  ): void {
    const updates = ['status = ?']
    const values: (string | number | null)[] = [status]

    if (status === 'sent') {
      updates.push('sent_at = CURRENT_TIMESTAMP')
    }
    if (status === 'deleted') {
      updates.push('deleted_at = CURRENT_TIMESTAMP')
    }
    if (extra?.telegram_message_id) {
      updates.push('telegram_message_id = ?')
      values.push(extra.telegram_message_id)
    }
    if (extra?.error !== undefined) {
      updates.push('error = ?')
      values.push(extra.error)
    }
    if (extra?.error_type !== undefined) {
      updates.push('error_type = ?')
      values.push(extra.error_type)
    }

    values.push(id)
    db.prepare(`UPDATE messages SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  },

  getPendingCount(campaignId: number): number {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE campaign_id = ? AND status = ?'
    ).get(campaignId, 'pending') as { count: number }
    return result.count
  },

  getStatusCounts(campaignId: number): Record<string, number> {
    const results = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM messages
      WHERE campaign_id = ?
      GROUP BY status
    `).all(campaignId) as { status: string; count: number }[]

    const counts: Record<string, number> = {}
    for (const row of results) {
      counts[row.status] = row.count
    }
    return counts
  },
}

export const stats = {
  getDashboardStats(): {
    totalCampaigns: number
    activeChannels: number
    messagesToday: number
    scheduledCampaigns: number
  } {
    const totalCampaigns = (db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number }).count
    const activeChannels = (db.prepare('SELECT COUNT(*) as count FROM channels WHERE is_active = 1').get() as { count: number }).count
    const scheduledCampaigns = (db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = 'scheduled'").get() as { count: number }).count

    const today = new Date().toISOString().split('T')[0]
    const messagesToday = (db.prepare(
      "SELECT COUNT(*) as count FROM messages WHERE status = 'sent' AND date(sent_at) = ?"
    ).get(today) as { count: number }).count

    return { totalCampaigns, activeChannels, messagesToday, scheduledCampaigns }
  },

  getRecentCampaigns(limit: number = 5): Campaign[] {
    return db.prepare(
      'SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ?'
    ).all(limit) as Campaign[]
  },

  getChannelsWithErrors(): Channel[] {
    return db.prepare(`
      SELECT DISTINCT c.* FROM channels c
      JOIN messages m ON c.id = m.channel_id
      WHERE m.error_type = 'permissions' AND m.status = 'failed'
      AND c.is_active = 1
    `).all() as Channel[]
  },
}
