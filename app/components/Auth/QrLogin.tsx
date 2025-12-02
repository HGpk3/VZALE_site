"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type StartResponse = {
  ok: boolean;
  token: string;
  qrUrl: string;
  expiresIn: number;
};

export default function QrLogin() {
  const [token, setToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  async function startLogin() {
    setStatus("Генерируем QR…");
    try {
      const res = await fetch("/api/auth/qr/start", { method: "POST" });
      const data = (await res.json()) as StartResponse;
      if (!data.ok) throw new Error("Не удалось создать сессию");
      setToken(data.token);
      setQrUrl(data.qrUrl);
      setStatus("Отсканируй QR в Telegram, я жду подтверждения…");
    } catch (e) {
      console.error(e);
      setStatus("Ошибка при создании сессии");
    }
  }

  // поллинг статуса
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/qr/status?token=${token}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.done && data.ok && !cancelled) {
          setStatus("Готово, переходим в личный кабинет…");
          window.location.href = "/me";
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <div className="flex flex-col items-center gap-4">
      {!token && (
        <button
          onClick={startLogin}
          className="px-4 py-2 rounded-lg bg-white text-black font-medium"
        >
          Войти через Telegram (QR)
        </button>
      )}

      {qrUrl && (
        <div className="flex flex-col items-center gap-2">
          {/* самый простой вариант: внешнее API, можно потом заменить на свою генерацию */}
          <Image
            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
              qrUrl
            )}`}
            alt="QR для входа через Telegram"
            width={240}
            height={240}
            className="rounded-xl border border-white/10 shadow-lg"
          />
          <p className="text-sm text-white/80 text-center">
            Отсканируй QR камерой телефона → откроется бот → нажми Start.
          </p>
        </div>
      )}

      {status && (
        <p className="text-xs text-white/60 text-center max-w-xs">{status}</p>
      )}
    </div>
  );
}
