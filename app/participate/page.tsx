import Link from "next/link";
import { cookies } from "next/headers";

import { fetchOpenTournaments, fetchLastTeamForCaptain } from "@/lib/tournaments";
import { TournamentSignup } from "../me/components/TournamentSignup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParticipatePage() {
  const cookieStore = await cookies();
  const telegramIdRaw = cookieStore.get("vzale_telegram_id")?.value;
  const telegramId = telegramIdRaw ? Number(telegramIdRaw) : null;

  const openTournaments = fetchOpenTournaments();
  const previousTeam = telegramId ? fetchLastTeamForCaptain(telegramId) : null;

  const needsAuth = !telegramId;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white px-4 py-12 md:py-16">
      <div className="relative max-w-6xl mx-auto space-y-10">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-20 left-10 w-[260px] h-[220px] bg-vz_purple blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[320px] h-[240px] bg-vz_green blur-[140px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            <span aria-hidden>←</span>
            <span>На главную</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/tournaments"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Архив и расписание
            </Link>
            <Link
              href="/me"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Личный кабинет
            </Link>
          </div>
        </div>

        <header className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">Регистрация</p>
          <h1 className="text-3xl md:text-4xl font-extrabold">Выберите турнир с открытой регистрацией</h1>
          <p className="text-sm md:text-base text-white/75 max-w-3xl">
            Мы подтянем состав вашей прошлой команды автоматически. После создания заявки пригласительная ссылка и код будут доступны для того, чтобы добавить или убрать игроков.
          </p>
        </header>

        {needsAuth ? (
          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/80">
            <p className="text-lg font-semibold mb-2">Нужен вход через Telegram</p>
            <p className="mb-4">
              Авторизуйтесь через бота, чтобы продолжить регистрацию. После входа вы увидите турниры с открытой регистрацией и сможете отправить заявку капитана или анкету свободного агента.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-vz_green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
            >
              Войти через бота
            </Link>
          </div>
        ) : openTournaments.length === 0 ? (
          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 space-y-3">
            <p className="text-lg font-semibold">Сейчас нет турниров с открытой регистрацией</p>
            <p>Следите за анонсами в боте или соцсетях, как только регистрация откроется — здесь появятся карточки.</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://t.me/vzalebb_bot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-vz_purple px-4 py-2 text-sm font-semibold text-white hover:bg-vz_green hover:text-black transition"
              >
                Открыть бота
              </Link>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Посмотреть прошедшие турниры
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75 space-y-2">
              <p className="font-semibold">Как это работает для капитанов</p>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>Выберите турнир с открытой регистрацией ниже.</li>
                <li>Мы подтянем прошлый состав, пригласительная ссылка и пароль останутся прежними.</li>
                <li>Добавляйте или убирайте игроков по ссылке из бота — изменения попадут в эту же базу.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <TournamentSignup openTournaments={openTournaments} previousTeam={previousTeam} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
