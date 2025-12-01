import { NextResponse } from "next/server";
import crypto from "crypto";

function getSecretKey() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error("[auth] TELEGRAM_BOT_TOKEN is not set");
    return null;
  }

  // делаем ключ только если токен есть
  return crypto.createHash("sha256").update(token).digest();
}

export async function POST(req: Request) {
  const data = await req.json();

  // Telegram присылает поле hash + остальные данные
  const { hash, ...authData } = data as Record<string, string | number>;

  const secretKey = getSecretKey();
  if (!secretKey) {
    return NextResponse.json(
      { ok: false, error: "Auth not configured on server" },
      { status: 500 }
    );
  }

  const checkString = Object.keys(authData)
    .sort()
    .map((k) => `${k}=${authData[k]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  if (hmac !== hash) {
    return NextResponse.json(
      { ok: false, error: "Invalid hash" },
      { status: 403 }
    );
  }

  const telegramId = authData.id;

  // тут потом добавим поиск/создание пользователя в БД
  return NextResponse.json({ ok: true, telegramId });
}
