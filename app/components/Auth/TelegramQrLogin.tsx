// app/components/Auth/TelegramQrLogin.tsx
"use client";

import { useEffect, useState } from "react";

export default function TelegramQrLogin() {
  const [link, setLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "error">(
    "pending"
  );

  useEffect(() => {
    // 1. запрашиваем токен
    (async () => {
      try {
        const res = await fetch("/api/auth/qr/start", { method: "POST" });
        const data = await res.json();
        setLink(data.link);
        setToken(data.token);
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    })();
  }, []);

  useEffect(() => {
    if (!token) return;

    // 2. начинаем опрашивать статус
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/qr/check?token=${token}`);
        const data = await res.json();

        if (data.status === "approved") {
          setStatus("approved");
          clearInterval(interval);
          // если бекенд возвращает токен/куку — можно сразу редиректить
          window.location.href = "/me";
        }
      } catch (e) {
        console.error(e);
        setStatus("error");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [token]);

  if (status === "error") {
    return <div className="text-red-500">Ошибка авторизации, попробуйте позже</div>;
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="text-center">
        <p>1. Нажмите кнопку ниже, чтобы открыть нашего бота в Telegram.</p>
        <p>2. В боте нажмите «Старт», и авторизация произойдёт автоматически.</p>
      </div>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-[#2AABEE] text-white font-medium"
        >
          Открыть бота в Telegram
        </a>
      )}

      {status === "pending" && (
        <p className="text-sm text-gray-400">
          Ждём подтверждение авторизации в боте…
        </p>
      )}

      {status === "approved" && (
        <p className="text-green-500">Успешно! Перенаправляем…</p>
      )}
    </div>
  );
}
