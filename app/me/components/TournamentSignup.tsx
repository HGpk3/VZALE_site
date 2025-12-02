"use client";

import { useMemo, useState } from "react";

export type TournamentOption = {
  id: number;
  name: string;
  dateStart: string | null;
  venue: string | null;
  status?: string;
};

interface Props {
  openTournaments: TournamentOption[];
}

export function TournamentSignup({ openTournaments }: Props) {
  const [teamName, setTeamName] = useState("");
  const [teamTournamentId, setTeamTournamentId] = useState<number | undefined>(
    openTournaments[0]?.id
  );
  const [faName, setFaName] = useState("");
  const [faInfo, setFaInfo] = useState("");
  const [faTournamentId, setFaTournamentId] = useState<number | undefined>(
    openTournaments[0]?.id
  );

  const [loading, setLoading] = useState<"team" | "fa" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => {
    if (openTournaments.length === 0) return null;
    return openTournaments.map((t) => ({
      value: t.id,
      label: `${t.name}${t.dateStart ? ` • ${t.dateStart}` : ""}`,
    }));
  }, [openTournaments]);

  async function submitTeam(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!teamTournamentId) {
      setError("Выберите турнир");
      return;
    }
    setLoading("team");
    try {
      const res = await fetch("/api/tournaments/register-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: teamTournamentId, teamName }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось зарегистрировать команду");
      }
      setMessage(
        data.inviteCode
          ? `Команда создана! Инвайт-код: ${data.inviteCode}`
          : "Команда создана"
      );
      setTeamName("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Неизвестная ошибка");
      }
    } finally {
      setLoading(null);
    }
  }

  async function submitFreeAgent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!faTournamentId) {
      setError("Выберите турнир");
      return;
    }
    setLoading("fa");
    try {
      const res = await fetch("/api/tournaments/free-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: faTournamentId,
          name: faName,
          info: faInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось сохранить анкету");
      }
      setMessage("Анкета свободного агента сохранена");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Неизвестная ошибка");
      }
    } finally {
      setLoading(null);
    }
  }

  if (!options) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        На данный момент нет турниров с открытой регистрацией. Зайдите позже
        или создайте турнир как админ.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-vz_green/40 bg-vz_green/15 px-4 py-3 text-sm text-vz_green">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <form
          onSubmit={submitTeam}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Регистрация команды
            </p>
            <h3 className="text-lg font-semibold">Я капитан, хочу подать заявку</h3>
            <p className="text-sm text-white/70">
              Сразу после создания команда появится в базе. Остальные игроки
              смогут подключиться по инвайт-коду или через бота.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Турнир</span>
            <select
              value={teamTournamentId}
              onChange={(e) => setTeamTournamentId(Number(e.target.value))}
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            >
              {options.map((o) => (
                <option key={o.value} value={o.value} className="bg-black">
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Название команды</span>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading === "team"}
            className="inline-flex justify-center rounded-xl bg-vz_green text-black font-semibold px-4 py-2 text-sm hover:brightness-110 disabled:opacity-60"
          >
            {loading === "team" ? "Отправляем..." : "Зарегистрировать"}
          </button>
        </form>

        <form
          onSubmit={submitFreeAgent}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Свободный агент
            </p>
            <h3 className="text-lg font-semibold">Хочу, чтобы меня позвали</h3>
            <p className="text-sm text-white/70">
              Анкета появится в поиске капитанов. Вы можете обновлять описание и
              выключать её через бота.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Турнир</span>
            <select
              value={faTournamentId}
              onChange={(e) => setFaTournamentId(Number(e.target.value))}
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            >
              {options.map((o) => (
                <option key={o.value} value={o.value} className="bg-black">
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Имя или позывной</span>
            <input
              value={faName}
              onChange={(e) => setFaName(e.target.value)}
              required
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Описание игрока</span>
            <textarea
              value={faInfo}
              onChange={(e) => setFaInfo(e.target.value)}
              rows={4}
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
              placeholder="Позиция, рост, опыт, контакты"
            />
          </label>

          <button
            type="submit"
            disabled={loading === "fa"}
            className="inline-flex justify-center rounded-xl bg-white/15 border border-white/10 text-white font-semibold px-4 py-2 text-sm hover:bg-white/25 disabled:opacity-60"
          >
            {loading === "fa" ? "Сохраняем..." : "Отправить анкету"}
          </button>
        </form>
      </div>
    </div>
  );
}
