import "dotenv/config";

import { Bot } from "grammy";
import { askDeepSeek } from "./services/ai";

// Read the Telegram token from the environment and fail fast with a clear message
// instead of starting a bot that cannot authenticate.
const botToken = (process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN)?.trim();
if (!botToken) {
  throw new Error("Set TELEGRAM_BOT_TOKEN or BOT_TOKEN in the environment before starting the bot.");
}

const bot = new Bot(botToken);

// Reply to the standard Telegram start command with the requested greeting.
bot.command("start", async (ctx) => {
  await ctx.reply("Вітаю, пан майбутній сеньйор!");
});

// Forward each plain-text message to DeepSeek and send its generated response
// back to the same Telegram chat.
bot.on("message:text", async (ctx) => {
  try {
    const response = await askDeepSeek(ctx.message.text);
    await ctx.reply(response);
  } catch (error) {
    // Keep API and configuration details in server logs while giving users a
    // clear, non-technical error message.
    console.error("Failed to process a Telegram text message with DeepSeek.", error);
    await ctx.reply("Вибачте, не вдалося обробити ваше повідомлення. Спробуйте пізніше.");
  }
});

// Log errors that escape individual handlers, such as failures while replying.
bot.catch(({ ctx, error }) => {
  console.error(`Telegram bot error while processing update ${ctx.update.update_id}.`, error);
});

// Start long polling and mark the process as failed if startup is rejected.
void bot.start().catch((error: unknown) => {
  console.error("Failed to start the Telegram bot.", error);
  process.exitCode = 1;
});