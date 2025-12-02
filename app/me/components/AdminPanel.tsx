"use client";

import { useState } from "react";
import { TournamentOption } from "./TournamentSignup";

interface AdminPanelProps {
  tournaments: TournamentOption[];
}

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  announced: "Анонс",
  registration_open: "Регистрация открыта",
  closed: "Регистрация закрыта",
  running: "Турнир идёт",
  finished: "Турнир завершён",
  archived: "Архив",
};

const statusOptions = Object.entries(statusLabels);

export function AdminPanel({ tournaments }: AdminPanelProps) {
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [status, setStatus] = useState("registration_open");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, venue, dateStart, status }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось создать турнир");
      }
      setMessage(`Турнир создан (ID ${data.id}). Обновите страницу, чтобы увидеть его в списке.`);
      setName("");
      setVenue("");
      setDateStart("");
      setStatus("registration_open");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Неизвестная ошибка");
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, newStatus: string) {
    setStatusLoading(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/tournaments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось обновить статус");
      }
      setMessage("Статус обновлён. Обновите страницу, чтобы увидеть изменения.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Неизвестная ошибка");
      }
    } finally {
      setStatusLoading(null);
    }
  }

  return (
    <div className="space-y-5">
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

      <form
        onSubmit={createTournament}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Админ</p>
          <h3 className="text-lg font-semibold">Создать новый турнир</h3>
          <p className="text-sm text-white/70">
            Данные сразу пишутся в базу бота, статусы и управление синхронизируются.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-white/70">Название</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-white/70">Локация</span>
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            placeholder="Город, площадка"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-white/70">Дата и время (свободный формат)</span>
          <input
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            placeholder="Например: 12 октября 13:00"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-white/70">Статус</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
          >
            {statusOptions.map(([value, label]) => (
              <option key={value} value={value} className="bg-black">
                {label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-xl bg-vz_green text-black font-semibold px-4 py-2 text-sm hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Создаём..." : "Создать турнир"}
        </button>
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Турниры</p>
            <h3 className="text-lg font-semibold">Быстрое управление</h3>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <p className="text-sm text-white/70">Пока нет созданных турниров.</p>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm text-white/60">Турнир #{t.id}</p>
                  <h4 className="text-base font-semibold">{t.name}</h4>
                  <p className="text-xs text-white/60">
                    {statusLabels[t.status] || t.status}
                    {t.dateStart ? ` • ${t.dateStart}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {statusOptions.map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => updateStatus(t.id, value)}
                      disabled={statusLoading === t.id}
                      className={`rounded-full border px-3 py-1 font-semibold transition ${
                        t.status === value
                          ? "bg-vz_green/20 border-vz_green/40 text-vz_green"
                          : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
