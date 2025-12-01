import { NextRequest, NextResponse } from "next/server";

type Pending = {
  createdAt: number;
  telegramId?: number;
};

const TTL_MS = 5 * 60 * 1000;

function getStore(): Map<string, Pending> {
  const g = global as any;
  if (!g.__vzaleQrStore) {
    g.__vzaleQrStore = new Map<string, Pending>();
  }
  return g.__vzaleQrStore;
}

export async function POST(req: NextRequest) {
  const { token, telegramId } = (await req.json()) as {
    token?: string;
    telegramId?: number;
  };

  if (!token || !telegramId) {
    return NextResponse.json(
      { ok: false, error: "No token or telegramId" },
      { status: 400 }
    );
  }

  const store = getStore();
  const pending = store.get(token);
  if (!pending) {
    return NextResponse.json(
      { ok: false, error: "Unknown or expired token" },
      { status: 400 }
    );
  }

  if (Date.now() - pending.createdAt > TTL_MS) {
    store.delete(token);
    return NextResponse.json(
      { ok: false, error: "Token expired" },
      { status: 400 }
    );
  }

  pending.telegramId = telegramId;
  store.set(token, pending);

  return NextResponse.json({ ok: true });
}
