## Hono CLI

Run `bunx hono --help` first, and use the CLI instead of a dev server.

## Railway variables

When syncing variables with Railway, never overwrite `TRIGGER_SECRET_KEY`. The development and production environments use different values, so preserve the existing environment-specific value in each environment.

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->
