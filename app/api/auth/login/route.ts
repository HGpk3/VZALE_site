// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Логин и пароль обязательны" },
        { status: 400 }
      );
    }

    const db = getDb();

    const row = db
      .prepare(
        "SELECT telegram_id, password_hash FROM web_users WHERE username = ?"
      )
      .get(username);

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, row.password_hash as string);

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const sessionId = crypto.randomUUID();

    const res = NextResponse.json({ ok: true });

    res.cookies.set("vzale_session", sessionId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set("vzale_telegram_id", String(row.telegram_id), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("LOGIN API ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
