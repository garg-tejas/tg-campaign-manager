import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'campaigns.db')
const db = new Database(dbPath)

db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id           TEXT UNIQUE NOT NULL,
    name                  TEXT NOT NULL,
    is_active             INTEGER DEFAULT 1,
    last_message_sent_at  TEXT NULL,
    created_at            TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    title                 TEXT NOT NULL,
    content_type          TEXT NOT NULL,
    text                  TEXT NOT NULL,
    media_path            TEXT NULL,
    media_filename        TEXT NULL,
    media_mimetype        TEXT NULL,
    parse_mode            TEXT DEFAULT 'HTML',
    disable_preview       INTEGER DEFAULT 0,
    disable_notification  INTEGER DEFAULT 0,
    status                TEXT DEFAULT 'draft',
    scheduled_at          TEXT NULL,
    created_at            TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at            TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaign_channels (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id           INTEGER NOT NULL,
    channel_id            INTEGER NOT NULL,
    created_at            TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, channel_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id           INTEGER NOT NULL,
    channel_id            INTEGER NOT NULL,
    telegram_message_id   TEXT NULL,
    parent_message_id     INTEGER NULL,
    content_snapshot      TEXT NOT NULL,
    media_snapshot_path   TEXT NULL,
    status                TEXT DEFAULT 'pending',
    error                 TEXT NULL,
    error_type            TEXT NULL,
    sent_at               TEXT NULL,
    deleted_at            TEXT NULL,
    created_at            TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_campaign_status ON messages(campaign_id, status);
  CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
  CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
  CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign ON campaign_channels(campaign_id);
`)

export default db
export interface Channel {
  id: number
  telegram_id: string
  name: string
  is_active: number
  last_message_sent_at: string | null
  created_at: string
}

export interface Campaign {
  id: number
  title: string
  content_type: 'text' | 'photo' | 'video' | 'document'
  text: string
  media_path: string | null
  media_filename: string | null
  media_mimetype: string | null
  parse_mode: 'HTML' | 'Markdown' | 'MarkdownV2' | null
  disable_preview: number
  disable_notification: number
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled'
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

export interface CampaignChannel {
  id: number
  campaign_id: number
  channel_id: number
  created_at: string
}

export interface Message {
  id: number
  campaign_id: number
  channel_id: number
  telegram_message_id: string | null
  parent_message_id: number | null
  content_snapshot: string
  media_snapshot_path: string | null
  status: 'pending' | 'sent' | 'deleted' | 'failed' | 'delete_failed' | 'cancelled'
  error: string | null
  error_type: 'rate_limit' | 'permissions' | 'network' | 'unknown' | null
  sent_at: string | null
  deleted_at: string | null
  created_at: string
}
