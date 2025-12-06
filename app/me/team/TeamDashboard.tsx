"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Member = { userId: number; role: string | null; status: string | null; fullName: string | null };
type Tournament = { id: number; name: string; status: string | null };

type ApiState = {
  ok: boolean;
  team: { id: number; name: string; captainUserId: number } | null;
  members: Member[];
  registration?: { tournamentId: number; registeredAt: string | null; tournamentName: string | null; status: string | null };
  openTournaments: Tournament[];
  isCaptain?: boolean;
  error?: string;
};

export default function TeamDashboard() {
  const [data, setData] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [registerTournamentId, setRegisterTournamentId] = useState<number | undefined>();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/team", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Не удалось загрузить данные");
      }
      setData(json);
      setTeamName(json.team?.name || "");
      if (json.registration?.tournamentId) {
        setRegisterTournamentId(json.registration.tournamentId);
      } else if (json.openTournaments?.[0]) {
        setRegisterTournamentId(json.openTournaments[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const payLink = useMemo(() => "https://pay.vzale.ru/stub", []);

  async function mutate(body: any) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Не удалось выполнить действие");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      setLoading(false);
    }
  }

  if (loading && !data) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-6">Загрузка...</div>;
  }

  if (error === "auth_required" || error?.includes("auth")) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-white/80">
        <p className="text-lg font-semibold text-white">Нужна авторизация через Telegram</p>
        <p>Войдите через бота, чтобы управлять своей командой.</p>
        <Link
          href="/login"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-vz_green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
        >
          Войти
        </Link>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
        Не удалось загрузить данные: {error}
      </div>
    );
  }

  if (!data) return null;

  if (!data.team) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <h3 className="text-lg font-semibold">Создайте команду</h3>
          <p className="text-sm text-white/70">
            У вас пока нет команды. Придумайте название и станьте капитаном — игроки смогут присоединиться по вашему коду в боте.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-vz_green focus:outline-none"
              placeholder="Название команды"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <button
              onClick={() => mutate({ action: "create", name: teamName })}
              className="inline-flex items-center justify-center rounded-xl bg-vz_green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
              disabled={loading}
            >
              Стать капитаном
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Для участия в турнире выберите его ниже после создания команды.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Название</p>
            <h2 className="text-2xl font-bold">{data.team.name}</h2>
            <p className="text-sm text-white/60">Капитан: {data.team.captainUserId}</p>
          </div>
          {data.isCaptain ? (
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm focus:border-vz_green focus:outline-none"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Новое название"
              />
              <button
                onClick={() => mutate({ action: "rename", name: teamName })}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition"
                disabled={loading}
              >
                Сохранить
              </button>
              <button
                onClick={() => mutate({ action: "delete" })}
                className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30 transition"
                disabled={loading}
              >
                Удалить команду
              </button>
            </div>
          ) : (
            <button
              onClick={() => mutate({ action: "leave" })}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition"
              disabled={loading}
            >
              Выйти из команды
            </button>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Состав</p>
          <div className="flex flex-col gap-2">
            {data.members?.map((member) => (
              <div
                key={member.userId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{member.fullName || `Игрок #${member.userId}`}</span>
                  <span className="text-white/60">{member.userId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] rounded-full px-2 py-1 border border-white/10 text-white/70">
                    {member.role === "captain" ? "Капитан" : "Игрок"}
                  </span>
                  {data.isCaptain && member.role !== "captain" ? (
                    <button
                      onClick={() => mutate({ action: "remove_member", userId: member.userId })}
                      className="text-[12px] text-red-200 hover:text-red-100"
                      disabled={loading}
                    >
                      Удалить
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.isCaptain ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-vz_green focus:outline-none"
              placeholder="ID игрока"
              value={newPlayerId}
              onChange={(e) => setNewPlayerId(e.target.value)}
            />
            <input
              className="flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-vz_green focus:outline-none"
              placeholder="Имя игрока (необязательно)"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            <button
              onClick={() => mutate({ action: "add_member", userId: Number(newPlayerId), fullName: newPlayerName })}
              className="rounded-xl bg-vz_green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
              disabled={loading}
            >
              Добавить игрока
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Статус турнира</p>
            {data.registration ? (
              <>
                <h3 className="text-xl font-semibold">{data.registration.tournamentName || "Выбранный турнир"}</h3>
                <p className="text-sm text-white/60">
                  Зарегистрированы {data.registration.registeredAt ? `с ${data.registration.registeredAt}` : ""}
                </p>
              </>
            ) : (
              <h3 className="text-xl font-semibold">Не зарегистрированы</h3>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {data.registration ? (
              <span className="rounded-full border border-vz_green/40 bg-vz_green/15 px-3 py-1 text-xs font-semibold text-vz_green">
                Registered
              </span>
            ) : (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                Not registered
              </span>
            )}
            {data.registration ? (
              <Link
                href={payLink}
                className="rounded-xl bg-gradient-to-r from-white/20 to-white/5 px-4 py-2 text-sm font-semibold text-white hover:from-vz_purple/40 hover:to-vz_green/40 transition"
              >
                Оплатить участие
              </Link>
            ) : null}
          </div>
        </div>

        {data.isCaptain ? (
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <select
              value={registerTournamentId}
              onChange={(e) => setRegisterTournamentId(Number(e.target.value))}
              className="w-full sm:w-auto flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-vz_green focus:outline-none"
            >
              {data.openTournaments?.map((t) => (
                <option key={t.id} value={t.id} className="bg-black">
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => mutate({ action: "register", tournamentId: registerTournamentId })}
              className="rounded-xl bg-vz_green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
              disabled={loading || !registerTournamentId}
            >
              Зарегистрировать
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
