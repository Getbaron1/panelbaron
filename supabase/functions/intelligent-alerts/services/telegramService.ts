import axios from "npm:axios@1.8.4";

type TelegramConfig = {
  token: string;
  chatId: string;
  timeoutMs: number;
};

function getTelegramConfig(): TelegramConfig {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID") || "";
  const timeoutMs = Number(Deno.env.get("TELEGRAM_TIMEOUT_MS") || "6000");

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN nao configurado");
  }
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID nao configurado");
  }

  return {
    token,
    chatId,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 6000,
  };
}

export async function sendTelegramAlert(message: string): Promise<void> {
  const config = getTelegramConfig();
  const telegramUrl = `https://api.telegram.org/bot${config.token}/sendMessage`;

  await axios.post(
    telegramUrl,
    {
      chat_id: config.chatId,
      text: message,
      disable_web_page_preview: true,
    },
    {
      timeout: config.timeoutMs,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
