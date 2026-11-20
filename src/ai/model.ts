import { createGoogle } from '@ai-sdk/google'
import { env } from '../env.js'

/** A low-cost Gemini model suitable for lightweight bot responses. */
export const GEMINI_MODEL = 'gemini-3.5-flash-lite'

const google = createGoogle({
  apiKey: env.googleGenerativeAiApiKey,
})

export const geminiModel = google(GEMINI_MODEL)
