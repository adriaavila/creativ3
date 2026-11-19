/**
 * Aviso de operación al Telegram de Adrian: el mismo bot y chat que usan las
 * rutinas del VPS con `hermes send` (TELEGRAM_BOT_TOKEN y TELEGRAM_HOME_CHANNEL
 * de /home/dev/.hermes/.env). Sin esas variables no manda nada y devuelve false;
 * si Telegram responde error, lanza para que la cola reintente.
 */
export async function sendTelegramAlert(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_HOME_CHANNEL?.trim();
  if (!token || !chatId) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`telegram_send_failed_${response.status}`);
  return true;
}
