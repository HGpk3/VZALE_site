import { NextRequest, NextResponse } from "next/server";

import { postJson } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await postJson<{ ok: boolean; error?: string }>("/api/tournaments/register-team", body);

    if (!result) {
      return NextResponse.json({ ok: false, error: "Сервис временно недоступен" }, { status: 502 });
    }

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "Не удалось подать заявку" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[register-team]", err);
    return NextResponse.json({ ok: false, error: "Не удалось подать заявку" }, { status: 500 });
  }
}
