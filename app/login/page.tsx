"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);

  try {
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const text = await res.text(); // <-- читаем как текст

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("Не JSON от сервера, сырой ответ:", text);
    }

    if (!res.ok || !data || !data.ok) {
      setError(
        (data && data.error) ||
          "Ошибка сервера при входе. Подробности смотри в консоли."
      );
      return;
    }

    window.location.href = "/me";
  } catch (err) {
    console.error(err);
    setError("Не удалось связаться с сервером");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen flex items-center justify-center bg-vz-gradient px-4">
      <div className="bg-black/60 rounded-3xl p-8 w-full max-w-md text-white shadow-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Вход в VZALE
        </h1>
        <p className="text-sm text-white/70 mb-6 text-center">
          Логин и пароль настраиваются в Telegram-боте командой{" "}
          <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">
            /web_login
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Логин</label>
            <input
              className="w-full rounded-xl bg-black/40 border border-white/20 px-3 py-2 text-sm outline-none focus:border-vz_green focus:ring-2 focus:ring-vz_green/40"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Пароль</label>
            <input
              type="password"
              className="w-full rounded-xl bg-black/40 border border-white/20 px-3 py-2 text-sm outline-none focus:border-vz_green focus:ring-2 focus:ring-vz_green/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-vz_green text-black font-semibold py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}
