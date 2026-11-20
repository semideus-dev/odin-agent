import { WEBHOOK_PATH } from "../app.js";
import { env } from "../env.js";
import { callApi } from "../telegram.js";

/**
 * Registers (or removes) this bot's webhook.
 *
 *   bun run webhook:set                      # register using TELEGRAM_WEBHOOK_URL
 *   bun run webhook:set -- https://bot.example.com/webhook/telegram
 *   bun run webhook:set -- --delete          # remove the webhook
 *   bun run webhook:set -- --info            # show current webhook status
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const flag = args.find((arg) => arg.startsWith("--"));
	const positional = args.find((arg) => !arg.startsWith("--"));

	if (flag === "--delete") {
		await callApi("deleteWebhook", { drop_pending_updates: true });
		console.log("Webhook deleted.");
		return;
	}

	if (flag === "--info") {
		console.log(JSON.stringify(await callApi("getWebhookInfo"), null, 2));
		return;
	}

	const baseUrl = positional ?? env.webhookUrl;
	if (!baseUrl) {
		throw new Error(
			"Missing webhook URL: pass it as an argument or set TELEGRAM_WEBHOOK_URL in .env",
		);
	}

	const url = new URL(
		WEBHOOK_PATH,
		baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
	).toString();
	if (!url.startsWith("https://")) {
		throw new Error(`Telegram requires an HTTPS webhook URL, got: ${url}`);
	}

	await callApi("setWebhook", {
		url,
		secret_token: env.webhookSecret,
		allowed_updates: ["message"],
		drop_pending_updates: true,
	});

	console.log(`Webhook set to ${url}`);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
