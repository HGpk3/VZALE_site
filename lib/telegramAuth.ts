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
};

// Кэшируем ключ, но считаем его только ПОСЛЕ того, как убедились, что env есть
let secretKey: Buffer | null = null;

function getSecretKey(): Buffer | null {
  if (secretKey) return secretKey;

  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error(
      "[telegramAuth] BOT_TOKEN is not set in environment variables"
    );
    return null;
  }

  secretKey = crypto.createHash("sha256").update(token).digest();
  return secretKey;
}

/**
 * Проверка подписи данных от Telegram Login Widget
 */
export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const key = getSecretKey();
  if (!key) {
    // ключ не смогли получить — считаем авторизацию невалидной, но модуль не падает
    return false;
  }

  const { hash, ...authData } = data;

  const checkString = Object.keys(authData)
    .sort()
    .map((key) => `${key}=${(authData as Record<string, string | number | undefined>)[key]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", key)
    .update(checkString)
    .digest("hex");

  if (hmac !== hash) {
    return false;
  }

  // На всякий случай проверим "свежесть" данных — не старше суток
  const now = Math.floor(Date.now() / 1000);
  if (now - Number(authData.auth_date) > 60 * 60 * 24) {
    return false;
  }

  return true;
}
