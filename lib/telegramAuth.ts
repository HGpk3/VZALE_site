import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
  [key: string]: any;
}

export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return false;
  }

  const { hash, ...userData } = data;

  // Собираем строки "key=value" по алфавиту ключей
  const checkString = Object.keys(userData)
    .sort()
    .map((key) => `${key}=${userData[key]}`)
    .join("\n");

  // secret = sha256(bot_token)
  const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();

  // hmac = HMAC-SHA256(checkString, secretKey)
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  return hmac === hash;
}
