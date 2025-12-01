import { NextResponse } from "next/server";
import crypto from "crypto";

// Твой bot token — нужно хранить в .env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SECRET_KEY = crypto.createHash("sha256").update(BOT_TOKEN).digest();

export async function POST(req: Request) {
  const data = await req.json();

  // 1. Проверяем подпись hash
  const { hash, ...authData } = data;

  const checkString = Object.keys(authData)
    .sort()
    .map((k) => `${k}=${authData[k]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(checkString)
    .digest("hex");

  if (hmac !== hash) {
    return NextResponse.json({ ok: false, error: "Invalid hash" }, { status: 403 });
  }

  // 2. Создать/найти пользователя в БД (заглушка)
  const telegramId = authData.id;
  // TODO: подключить Prisma/DB и создать пользователя

  // 3. Вернуть успех + куку сессии
  return NextResponse.json({ ok: true });
}
