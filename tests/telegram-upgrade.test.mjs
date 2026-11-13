import assert from 'node:assert/strict'
import test from 'node:test'

// Install the transport double before constructing the SDK client. These tests
// never load application env files or contact Telegram.
process.env.TELEGRAM_BOT_TOKEN = 'offline-fixture-token'
const calls = []
globalThis.fetch = async (url, init) => {
  const method = String(url).split('/').at(-1)
  const body = typeof init.body === 'string' ? new URLSearchParams(init.body) : init.body
  assert.ok(body instanceof URLSearchParams || body instanceof FormData)
  calls.push({ method, body })
  const result = method === 'deleteMessage' ? true : { message_id: 42, date: 0, chat: { id: -1, type: 'channel' }, text: 'fixture' }
  return new Response(JSON.stringify({ ok: true, result }), { status: 200, headers: { 'content-type': 'application/json' } })
}
const telegram = await import('../lib/telegram.ts')

test('text retains preview, reply, formatting and notification options on the upgraded SDK', async () => {
  calls.length = 0
  const message = await telegram.sendTextMessage('-1', '<b>Example</b>', { parseMode: 'HTML', disablePreview: true, disableNotification: true, replyToMessageId: 7 })
  assert.equal(message.message_id, 42)
  const { method, body } = calls[0]
  assert.equal(method, 'sendMessage')
  assert.equal(body.get('chat_id'), '-1')
  assert.equal(body.get('text'), '<b>Example</b>')
  assert.equal(body.get('parse_mode'), 'HTML')
  assert.deepEqual(JSON.parse(body.get('reply_parameters')), { message_id: 7 })
  assert.deepEqual(JSON.parse(body.get('link_preview_options')), { is_disabled: true })
  assert.equal(body.get('disable_notification'), 'true')
  assert.equal(body.has('reply_to_message_id'), false)
  assert.equal(body.has('disable_web_page_preview'), false)
})

test('absent options stay absent and false preview selection remains explicit', async () => {
  calls.length = 0
  await telegram.sendTextMessage('-1', 'Plain')
  assert.equal(calls[0].body.has('reply_parameters'), false)
  assert.equal(calls[0].body.has('link_preview_options'), false)
  await telegram.sendTextMessage('-1', 'Plain', { disablePreview: false })
  assert.deepEqual(JSON.parse(calls[1].body.get('link_preview_options')), { is_disabled: false })
})

test('photo, video and document buffer uploads retain content, captions and replies', async () => {
  for (const [send, field] of [[telegram.sendPhoto, 'photo'], [telegram.sendVideo, 'video'], [telegram.sendDocument, 'document']]) {
    calls.length = 0
    await send('-1', Buffer.from('synthetic-file-bytes'), 'Fixture caption', { replyToMessageId: 9 })
    const body = calls[0].body
    assert.ok(body instanceof FormData)
    assert.equal(await body.get(field).text(), 'synthetic-file-bytes')
    assert.equal(body.get('caption'), 'Fixture caption')
    assert.deepEqual(JSON.parse(body.get('reply_parameters')), { message_id: 9 })
  }
})

test('channel check uses the test transport and deletes its own fixture message', async () => {
  calls.length = 0
  assert.deepEqual(await telegram.validateChannelAccess('-1'), { valid: true })
  assert.deepEqual(calls.map(call => call.method), ['sendMessage', 'deleteMessage'])
  assert.equal(calls[1].body.get('message_id'), '42')
})
