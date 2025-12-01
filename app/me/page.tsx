// app/me/page.tsx
import { cookies } from "next/headers";
import TelegramLoginButton from "../components/Auth/TelegramLoginButton";

export default async function MePage() {
  const cookieStore = await cookies();
  const telegramId = cookieStore.get("vzale_telegram_id")?.value;

  // === Пользователь НЕ залогинен ===
  if (!telegramId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-vz-gradient px-4">
        <div className="bg-black/50 rounded-3xl p-8 w-full max-w-md text-center shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-white">
            Вход в личный кабинет
          </h1>
          <p className="text-sm text-white/70 mb-6">
            Войдите через Telegram, чтобы увидеть свои команды,
            турниры и статистику в VZALE.
          </p>
          <TelegramLoginButton />
          <p className="mt-4 text-xs text-white/50">
            Мы используем только ваш Telegram ID и имя. Данные не
            передаются третьим лицам.
          </p>
        </div>
      </main>
    );
  }

  // === Пользователь ЗАЛОГИНЕН ===
  return (
    <main className="min-h-screen flex items-center justify-center bg-vz-gradient px-4">
      <div className="bg-black/60 rounded-3xl p-8 w-full max-w-xl text-white shadow-xl space-y-4">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>
        <p className="text-sm text-white/70">
          Вы вошли в систему через Telegram.
        </p>

        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
          <div className="text-xs text-white/50 mb-1">Ваш Telegram ID</div>
          <div className="font-mono text-lg">{telegramId}</div>
        </div>

        <a
          href="https://t.me/vzalebb_bot"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-vz_purple hover:bg-vz_purple/80 transition"
        >
          Открыть бота VZALE в Telegram
        </a>

        <p className="text-xs text-white/40">
          Позже сюда подтянем ваши команды и статистику из базы турниров.
        </p>
      </div>
    </main>
  );
}
