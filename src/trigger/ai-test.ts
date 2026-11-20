import { generateText } from 'ai'
import { logger, task } from '@trigger.dev/sdk'
import { geminiModel } from '../ai/model.js'

export const aiTestTask = task({
  id: 'ai-test-generation',
  maxDuration: 300,
  run: async (payload: { prompt: string }) => {
    const result = await generateText({
      model: geminiModel,
      instructions: 'Answer clearly and concisely in plain text.',
      prompt: payload.prompt,
      maxOutputTokens: 256,
    })

    logger.log('AI test generation completed', {
      promptLength: payload.prompt.length,
    })

    return {
      prompt: payload.prompt,
      response: result.text,
    }
  },
})
