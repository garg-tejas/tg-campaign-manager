import TelegramBot from 'node-telegram-bot-api'
import type { Message } from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.warn('Warning: TELEGRAM_BOT_TOKEN is not set. Bot functionality will not work.')
}

const bot = token
  ? new TelegramBot(token, { polling: false })
  : null

export default bot

export function getBot(): TelegramBot {
  if (!bot) {
    throw new Error('Telegram bot is not initialized. Please set TELEGRAM_BOT_TOKEN.')
  }
  return bot
}

export interface SendMessageOptions {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disablePreview?: boolean
  disableNotification?: boolean
  replyToMessageId?: number
}

function escapeMarkdownV2(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!')
}

// Closes unclosed HTML tags. Telegram supports: <b>, <i>, <u>, <s>, <a>, <code>, <pre>
function cleanHTML(text: string): string {
  const supportedTags = ['b', 'i', 'u', 's', 'a', 'code', 'pre']
  const openTags: string[] = []
  let cleaned = text
  
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g
  const matches: Array<{ fullMatch: string; tagName: string; isClosing: boolean; index: number }> = []
  let match
  
  while ((match = tagRegex.exec(text)) !== null) {
    const tagName = match[1].toLowerCase()
    if (supportedTags.includes(tagName)) {
      matches.push({
        fullMatch: match[0],
        tagName,
        isClosing: match[0].startsWith('</'),
        index: match.index
      })
    }
  }
  
  for (const { tagName, isClosing } of matches) {
    if (isClosing) {
      const lastIndex = openTags.lastIndexOf(tagName)
      if (lastIndex !== -1) {
        openTags.splice(lastIndex, 1)
      }
    } else {
      openTags.push(tagName)
    }
  }
  
  if (openTags.length > 0) {
    cleaned += openTags.reverse().map(tag => `</${tag}>`).join('')
  }
  
  return cleaned
}

// Fixes unclosed Markdown. Telegram Markdown supports: *bold*, _italic_, `code`, [text](url)
function cleanMarkdown(text: string): string {
  let cleaned = text
  
  // Remove unsupported entities (blockquote >, strikethrough ~)
  cleaned = cleaned.replace(/^>\s+/gm, '')
  cleaned = cleaned.replace(/>/g, '')
  cleaned = cleaned.replace(/~/g, '')
  
  // Protect complete links by temporarily replacing them
  const completeLinks: string[] = []
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
  let linkMatch
  let linkIndex = 0
  
  while ((linkMatch = linkPattern.exec(cleaned)) !== null) {
    const placeholder = `__LINK${linkIndex}__`
    completeLinks.push(linkMatch[0])
    cleaned = cleaned.replace(linkMatch[0], placeholder)
    linkIndex++
  }
  
  const asterisks = (cleaned.match(/\*/g) || []).length
  const underscores = (cleaned.match(/_/g) || []).length
  const backticks = (cleaned.match(/`/g) || []).length
  
  if (asterisks % 2 !== 0) cleaned += '*'
  if (underscores % 2 !== 0) cleaned += '_'
  if (backticks % 2 !== 0) cleaned += '`'
  
  // Convert broken [text] without (url) to plain text
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, (match, text, offset) => {
    const after = cleaned.substring(offset + match.length).trim()
    return after.startsWith('(') ? match : text
  })
  
  // Convert broken (url) without [text] to plain text
  cleaned = cleaned.replace(/\(([^)]+)\)/g, (match, url, offset) => {
    const before = cleaned.substring(0, offset).trim()
    return before.endsWith(']') ? match : url
  })
  
  completeLinks.forEach((link, idx) => {
    cleaned = cleaned.replace(`__LINK${idx}__`, link)
  })
  
  return cleaned
}

function escapeText(text: string, parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'): string {
  // MarkdownV2: pass through as-is, user is responsible for correct formatting
  if (parseMode === 'MarkdownV2') return text
  if (parseMode === 'HTML') return cleanHTML(text)
  if (parseMode === 'Markdown') return cleanMarkdown(text)
  return text
}

export async function sendTextMessage(
  chatId: string,
  text: string,
  options: SendMessageOptions = {}
): Promise<Message> {
  const bot = getBot()
  const escapedText = escapeText(text, options.parseMode)
  
  return await bot.sendMessage(chatId, escapedText, {
    parse_mode: options.parseMode,
    link_preview_options: options.disablePreview === undefined ? undefined : { is_disabled: options.disablePreview },
    disable_notification: options.disableNotification,
    reply_parameters: options.replyToMessageId === undefined ? undefined : { message_id: options.replyToMessageId },
  })
}

export async function sendPhoto(
  chatId: string,
  photo: string | Buffer,
  caption: string,
  options: SendMessageOptions = {}
): Promise<Message> {
  const bot = getBot()
  const escapedCaption = escapeText(caption, options.parseMode)
  
  return await bot.sendPhoto(chatId, photo, {
    caption: escapedCaption,
    parse_mode: options.parseMode,
    disable_notification: options.disableNotification,
    reply_parameters: options.replyToMessageId === undefined ? undefined : { message_id: options.replyToMessageId },
  })
}

export async function sendVideo(
  chatId: string,
  video: string | Buffer,
  caption: string,
  options: SendMessageOptions = {}
): Promise<Message> {
  const bot = getBot()
  const escapedCaption = escapeText(caption, options.parseMode)
  
  return await bot.sendVideo(chatId, video, {
    caption: escapedCaption,
    parse_mode: options.parseMode,
    disable_notification: options.disableNotification,
    reply_parameters: options.replyToMessageId === undefined ? undefined : { message_id: options.replyToMessageId },
  })
}

export async function sendDocument(
  chatId: string,
  document: string | Buffer,
  caption: string,
  options: SendMessageOptions = {}
): Promise<Message> {
  const bot = getBot()
  const escapedCaption = escapeText(caption, options.parseMode)
  
  return await bot.sendDocument(chatId, document, {
    caption: escapedCaption,
    parse_mode: options.parseMode,
    disable_notification: options.disableNotification,
    reply_parameters: options.replyToMessageId === undefined ? undefined : { message_id: options.replyToMessageId },
  })
}

export async function deleteMessage(
  chatId: string,
  messageId: number
): Promise<boolean> {
  const bot = getBot()
  return bot.deleteMessage(chatId, messageId)
}

export async function validateChannelAccess(telegramId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const bot = getBot()
    const testMsg = await bot.sendMessage(
      telegramId,
      '✅ Bot connected successfully!',
      { disable_notification: true }
    )
    await bot.deleteMessage(telegramId, testMsg.message_id)
    return { valid: true }
  } catch (err: unknown) {
    const error = err as Error
    return { valid: false, error: error.message }
  }
}
