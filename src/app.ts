import { timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { generateText } from 'ai'
import { tasks } from '@trigger.dev/sdk'
import { geminiModel } from './ai/model.js'
import { env } from './env.js'
import { sendMessage, type TelegramMessage, type TelegramUpdate } from './telegram.js'
import type { aiTestTask } from './trigger/ai-test.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Telegram AI bot is running')
})

/**
 * Temporary public AI smoke test.
 *
 * Remove this route once the deployed AI integration has been verified.
 */
app.get('/test/ai', async (c) => {
  const prompt = c.req.query('prompt')?.trim() || 'Say hello in one short sentence.'

  if (prompt.length > 1000) {
    return c.json({ error: 'prompt must be 1000 characters or fewer' }, 400)
  }

  try {
    const run = await tasks.trigger<typeof aiTestTask>('ai-test-generation', {
      prompt,
    })

    return c.json(
      {
        taskId: 'ai-test-generation',
        runId: run.id,
        status: 'queued',
      },
      202,
    )
  } catch (error) {
    console.error('Failed to queue AI test task', error)
    return c.json({ error: 'Failed to queue AI generation' }, 502)
  }
})

export const WEBHOOK_PATH = '/webhook/telegram'

/**
 * Telegram sends the secret we passed to setWebhook in this header, so a
 * request without a matching value did not come from our webhook.
 */
function hasValidSecret(received: string | undefined): boolean {
  if (!received) return false

  const expected = Buffer.from(env.webhookSecret)
  const actual = Buffer.from(received)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

async function answerMessage(message: TelegramMessage): Promise<void> {
  const text = message.text ?? message.caption

  if (!text) {
    await sendMessage(message.chat.id, 'I can only answer text messages for now.', {
      replyToMessageId: message.message_id,
    })
    return
  }

  const result = await generateText({
    model: geminiModel,
    instructions:
      'You are a helpful Telegram assistant. Answer clearly and concisely. ' +
      'Keep responses under 3500 characters and use plain text without Markdown formatting.',
    prompt: text,
    maxOutputTokens: 512,
  })

  await sendMessage(message.chat.id, result.text, {
    replyToMessageId: message.message_id,
  })
}

app.post(WEBHOOK_PATH, async (c) => {
  if (!hasValidSecret(c.req.header('X-Telegram-Bot-Api-Secret-Token'))) {
    return c.text('Unauthorized', 401)
  }

  let update: TelegramUpdate
  try {
    update = await c.req.json<TelegramUpdate>()
  } catch {
    return c.text('Bad Request', 400)
  }

  // Only handle new messages: echoing edits would double-reply in a chat.
  if (update.message) {
    try {
      await answerMessage(update.message)
    } catch (error) {
      // Log and still return 200, otherwise Telegram keeps retrying the update.
      console.error('Failed to handle update', update.update_id, error)
    }
  }

  return c.text('OK')
})

export default app
