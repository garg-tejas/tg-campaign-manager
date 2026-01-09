# Telegram Campaign Dashboard

A Next.js application for managing and scheduling promotional campaigns across multiple Telegram channels. Built for running locally on your laptop with support for scheduled sends, selective message deletion, and reply functionality.

## What This Does

This tool lets you send messages to multiple Telegram channels at once, schedule campaigns for later, delete messages from specific channels, and reply to sent messages. It uses a local SQLite database and Redis queue for reliable message delivery.

## Prerequisites

You'll need:

- Node.js 18 or higher
- A Telegram bot token (get one from [@BotFather](https://t.me/botfather))
- Redis running locally or via Docker
- Your bot must be an admin in the channels you want to post to

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

If you get errors with better-sqlite3, rebuild it:

```bash
pnpm rebuild better-sqlite3
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_PASSWORD=your_password_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

The default admin password is `admin123` if you don't set one.

### 3. Start Redis

If you have Docker installed:

```bash
docker run -d -p 6379:6379 redis
```

Or install and run Redis natively on your system.

### 4. Run the Development Server

```bash
pnpm dev
```

Open http://localhost:3000 and log in with your admin password.

## Using Docker

If you prefer running everything in containers:

### Setup

Make sure you have a `.env` file (not `.env.local`) in the project root, or use:

```bash
cp .env.local .env
```

### Start Everything

```bash
docker-compose up -d
```

This starts both the app and Redis. Access the dashboard at http://localhost:3000.

### Useful Commands

View logs:

```bash
docker-compose logs -f
```

Stop everything:

```bash
docker-compose down
```

Rebuild after code changes:

```bash
docker-compose up -d --build
```

## How It Works

The application uses BullMQ for job queuing, which handles scheduled sends and rate limiting. Messages are stored in SQLite along with their status (pending, sent, failed, etc.). Media files are saved to the `data/media` directory.

When you create a campaign, it:

1. Validates that the selected channels exist
2. Creates message records for each channel
3. Queues jobs for sending (immediately or at the scheduled time)
4. Updates message status as they're sent

Rate limiting is enforced at 400ms between messages per channel to avoid hitting Telegram's limits.

## Features

- Multi-channel message broadcasting
- Schedule campaigns for specific dates/times
- Support for text, photos, videos, and documents
- HTML, Markdown, and MarkdownV2 formatting
- Selective message deletion (choose which channels to delete from)
- Reply to sent messages in specific channels
- Dry run mode (sends to only the first channel)
- Campaign status tracking
- Error handling with automatic retry for rate limits and network issues

## Project Structure

```
app/
  api/          - API routes for campaigns, channels, stats
  (authenticated)/ - Protected pages (dashboard, campaigns, channels)
  login/        - Login page
lib/
  db.ts         - Database schema and initialization
  queries.ts    - Database query helpers
  telegram.ts   - Telegram Bot API wrapper
  queue.ts      - BullMQ configuration
  worker.ts     - Background job processor
data/
  campaigns.db  - SQLite database (auto-created)
  media/        - Uploaded media files
```

## Troubleshooting

**"Cannot connect to Redis"**
Make sure Redis is running. Check with `docker ps` if using Docker, or verify the Redis service is started if installed natively.

**"Foreign key constraint failed"**
This usually means you're trying to assign channels that don't exist. Add channels first through the Channels page.

**"Bot was kicked from chat"**
Your bot needs to be re-added as an admin to the channel. The affected channel will be automatically disabled.

**Build warnings about middleware**
The deprecation warning about proxy.ts is harmless. The app works fine with the current middleware setup.

## Notes

- This is designed for local use, not for production deployment
- Authentication is basic (single password) since it's meant for personal use
- The SQLite database and media files persist in the `data/` directory
- BullMQ requires Redis and won't work with in-memory alternatives
- Channel IDs should start with `-100` (Telegram supergroup/channel format)
