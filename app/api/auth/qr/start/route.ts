import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

type Pending = {
  createdAt: number;
  telegramId?: number;
};

const TTL_MS = 5 * 60 * 1000; // 5 минут

function getStore(): Map<string, Pending> {
  const g = global as any;
  if (!g.__vzaleQrStore) {
    g.__vzaleQrStore = new Map<string, Pending>();
  }
  return g.__vzaleQrStore;
}

export async function POST(req: NextRequest) {
  const token = crypto.randomBytes(16).toString("hex");
  const store = getStore();
  store.set(token, { createdAt: Date.now() });

  const origin = req.nextUrl.origin;
  // deep-link для бота: ОБЯЗАТЕЛЬНО правильный username бота без @
  const qrUrl = `https://t.me/vzalebb_bot?start=web_${token}`;

  return NextResponse.json({
    ok: true,
    token,
    qrUrl,
    expiresIn: TTL_MS / 1000, // сек
  });
}
