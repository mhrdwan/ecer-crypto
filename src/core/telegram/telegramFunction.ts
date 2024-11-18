import dotenv from "dotenv";
import { Telegraf } from "telegraf";
dotenv.config();

const bot = new Telegraf(process.env.API_TELEGRAM_BOT as string);

export async function sendTelegramMessage({
  chatId ,
  message ,
}: {
  chatId: number;
  message?: any;
}) {
  console.log(`Chat ID: ${chatId}`);
  try {
    await bot.telegram.sendMessage(chatId, message);
    console.log(`Message sent to chat ID: ${chatId}`);
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}
