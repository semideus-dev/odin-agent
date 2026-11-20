# odin-agent

A tiny Telegram echo bot built with [Hono](https://hono.dev). Every text message
the bot receives is sent straight back to the same chat.

## Setup

```sh
bun install
cp .env.example .env   # then fill in the values
```

`.env` needs:

| Variable | Description |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBHOOK_SECRET` | Random string (`A-Z a-z 0-9 _ -`), checked against the `X-Telegram-Bot-Api-Secret-Token` header |
| `TELEGRAM_WEBHOOK_URL` | Public HTTPS base URL of this server |

Generate a secret with:

```sh
node -e "console.log(crypto.randomUUID().replace(/-/g, ''))"
```

## Run

```sh
bun run dev                       # http://localhost:3000
```

Expose the port over HTTPS (for example with a tunnel), then register the webhook:

```sh
bun run webhook:set               # uses TELEGRAM_WEBHOOK_URL
bun run webhook:set -- https://bot.example.com   # or pass it explicitly
bun run webhook:info
bun run webhook:delete
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `POST` | `/webhook/telegram` | Telegram update receiver (echoes text) |

Requests without a matching `X-Telegram-Bot-Api-Secret-Token` header get `401`.
Non-text messages (photos, stickers, ...) are answered with a short notice.
Messages longer than 4096 characters are split into several messages.
