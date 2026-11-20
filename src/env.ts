import { existsSync } from 'node:fs'

// tsx does not load .env files, so do it ourselves (Node >= 20.12).
if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/**
 * Values are read lazily so that importing the app (for example in tests)
 * does not fail before the environment is ready.
 */
export const env = {
  get botToken(): string {
    return required('TELEGRAM_BOT_TOKEN')
  },
  get webhookSecret(): string {
    return required('TELEGRAM_WEBHOOK_SECRET')
  },
  get webhookUrl(): string | undefined {
    return process.env.TELEGRAM_WEBHOOK_URL
  },
  get port(): number {
    return Number(process.env.PORT ?? 3000)
  },
  /** Overridable so the Bot API can be mocked in local tests. */
  get apiBaseUrl(): string {
    return process.env.TELEGRAM_API_BASE_URL ?? 'https://api.telegram.org'
  },
}
