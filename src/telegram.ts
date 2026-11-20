import { env } from './env.js'

/** Minimal subset of the Telegram Bot API types this bot needs. */

export type TelegramUser = {
  id: number
  is_bot: boolean
  first_name: string
  username?: string
}

export type TelegramChat = {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
}

export type TelegramMessage = {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  caption?: string
}

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  channel_post?: TelegramMessage
}

type ApiResponse<T> =
  | { ok: true; result: T }
  | { ok: false; error_code: number; description: string }

const MAX_MESSAGE_LENGTH = 4096
const CHUNK_SIZE = 4000

function apiUrl(method: string): string {
  return `${env.apiBaseUrl}/bot${env.botToken}/${method}`
}

/** Call any Bot API method and throw on Telegram-side errors. */
export async function callApi<T>(
  method: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!data) {
    throw new Error(`Telegram API ${method} returned a non-JSON response (${response.status})`)
  }
  if (!data.ok) {
    throw new Error(`Telegram API ${method} failed: ${data.error_code} ${data.description}`)
  }

  return data.result
}

/** Split long text so it fits Telegram's per-message limit. */
function chunkText(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text]

  const chunks: string[] = []
  for (let index = 0; index < text.length; index += CHUNK_SIZE) {
    let end = Math.min(index + CHUNK_SIZE, text.length)
    // Do not cut a surrogate pair (emoji) in half at the boundary.
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1] ?? '')) {
      end += 1
    }
    chunks.push(text.slice(index, end))
  }
  return chunks
}

/**
 * Send a text message. No parse_mode is used on purpose: the bot echoes
 * arbitrary user input, and HTML/Markdown parsing would let users break it.
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options: { replyToMessageId?: number } = {},
): Promise<void> {
  const chunks = chunkText(text)

  for (const [index, chunk] of chunks.entries()) {
    await callApi('sendMessage', {
      chat_id: chatId,
      text: chunk,
      ...(options.replyToMessageId !== undefined && index === 0
        ? { reply_parameters: { message_id: options.replyToMessageId } }
        : {}),
    })
  }
}
