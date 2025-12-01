// src/lib/telegramAuth.ts
import crypto from "crypto";

export type TelegramAuthData = {
  id: number;
  auth_date: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  hash: string;
  [key: string]: any;
};

const BOT_TOKEN = process.env.BOT_TOKEN!;
const SECRET_KEY = crypto.createHash("sha256").update(BOT_TOKEN).digest();

/**
 * Проверка подписи данных от Telegram Login Widget
 */
export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const { hash, ...authData } = data;

  const checkString = Object.keys(authData)
    .sort()
    .map((key) => `${key}=${authData[key]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(checkString)
    .digest("hex");

  if (hmac !== hash) {
    return false;
  }

  // На всякий случай проверим, что данные не супер-старые (1 день)
  const now = Math.floor(Date.now() / 1000);
  if (now - Number(authData.auth_date) > 60 * 60 * 24) {
    return false;
  }

  return true;
}
