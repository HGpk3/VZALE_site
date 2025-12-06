"use client";

import { useMemo, useState } from "react";

type TeamMember = {
  userId: number;
  fullName: string | null;
  isCaptain: number;
  role?: string | null;
  status?: string | null;
};

type CaptainTeam = {
  teamId: number;
  name: string;
  tournamentId: number | null;
  tournamentName: string | null;
  inviteCode?: string | null;
  paid?: number;
  roster: TeamMember[];
};

type ManagePayload = {
  ok: boolean;
  error?: string;
  team?: CaptainTeam;
};

interface Props {
  teams: CaptainTeam[];
}

export function MyTeamPanel({ teams }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    teams[0]?.teamId ?? null,
  );
  const [roster, setRoster] = useState<Record<number, TeamMember[]>>(() => {
    const initial: Record<number, TeamMember[]> = {};
    teams.forEach((t) => {
      initial[t.teamId] = t.roster;
    });
    return initial;
  });
  const [teamNames, setTeamNames] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    teams.forEach((t) => {
      initial[t.teamId] = t.name;
    });
    return initial;
  });
  const [paidMap, setPaidMap] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    teams.forEach((t) => {
      initial[t.teamId] = t.paid ?? 0;
    });
    return initial;
  });

  const [newName, setNewName] = useState("");
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [loading, setLoading] = useState<"rename" | "add" | "remove" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeTeam = useMemo(
    () => teams.find((t) => t.teamId === selectedTeamId) ?? teams[0],
    [selectedTeamId, teams],
  );

  const currentRoster = roster[activeTeam?.teamId ?? -1] ?? [];

  async function perform(action: string, payload: Record<string, unknown>) {
    if (!activeTeam) return;
    setError(null);
    setMessage(null);
    try {
      setLoading(action as typeof loading);
      const res = await fetch("/api/team/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, teamId: activeTeam.teamId, ...payload }),
      });
      const data = (await res.json()) as ManagePayload;
      if (!res.ok || !data.ok || !data.team) {
        throw new Error(data.error || "Не удалось обновить команду");
      }

      setRoster((prev) => ({ ...prev, [data.team!.teamId]: data.team!.roster }));
      setTeamNames((prev) => ({ ...prev, [data.team!.teamId]: data.team!.name }));
      setPaidMap((prev) => ({ ...prev, [data.team!.teamId]: data.team!.paid ?? 0 }));
      setMessage("Изменения сохранены");
      setNewName("");
      setNewPlayerId("");
      setNewPlayerName("");
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

  function removePlayer(userId: number) {
    perform("remove_player", { userId });
  }

  function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(newPlayerId);
    if (!id) {
      setError("Укажите Telegram ID игрока");
      return;
    }
    perform("add_player", { userId: id, fullName: newPlayerName || undefined });
  }

  function renameTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Введите новое название");
      return;
    }
    perform("rename", { newName });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 text-xs" role="tablist">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80">
            Вкладка
          </span>
          <span className="rounded-full bg-vz_green/20 text-vz_green px-3 py-1.5 border border-vz_green/40">
            Моя команда
          </span>
        </div>

        <select
          value={selectedTeamId ?? undefined}
          onChange={(e) => setSelectedTeamId(Number(e.target.value))}
          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-vz_green"
        >
          {teams.map((t) => (
            <option key={t.teamId} value={t.teamId} className="bg-black">
              {t.name} — {t.tournamentName || "Турнир"}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {activeTeam?.tournamentName || "Турнир"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            ID команды: {activeTeam?.teamId}
          </span>
          {activeTeam?.inviteCode ? (
            <span className="rounded-full border border-vz_green/40 bg-vz_green/15 px-3 py-1 text-vz_green">
              Инвайт-код: {activeTeam.inviteCode}
            </span>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-vz_green/40 bg-vz_green/15 px-4 py-3 text-sm text-vz_green">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-lg font-semibold">Название и оплата</h3>
          <p className="text-sm text-white/70">
            Переименуйте команду или отметьте статус оплаты. Ссылку на оплату добавим позже.
          </p>
          <form className="space-y-2" onSubmit={renameTeam}>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Новое название</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
                placeholder={teamNames[activeTeam?.teamId ?? -1] || "Название команды"}
              />
            </label>
            <button
              type="submit"
              disabled={loading === "rename"}
              className="inline-flex justify-center rounded-xl bg-vz_green text-black font-semibold px-4 py-2 text-sm hover:brightness-110 disabled:opacity-60"
            >
              {loading === "rename" ? "Сохраняем..." : "Сохранить"}
            </button>
          </form>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
            <div className="flex flex-col">
              <span className="text-white/70">Статус оплаты</span>
              <span className="text-xs text-white/50">
                {paidMap[activeTeam?.teamId ?? -1] ? "Отмечена" : "Пока без оплаты"}
              </span>
            </div>
            <button
              type="button"
              className="rounded-lg bg-white/15 border border-white/10 px-3 py-1.5 text-xs text-white/80"
              disabled
              title="Заглушка для ссылки на оплату"
            >
              Оплатить (скоро)
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-lg font-semibold">Добавить игрока</h3>
          <p className="text-sm text-white/70">
            Добавьте участника по Telegram ID. Имя можно указать сразу, чтобы оно появилось в составе.
          </p>
          <form className="space-y-3" onSubmit={addPlayer}>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Telegram ID игрока</span>
              <input
                value={newPlayerId}
                onChange={(e) => setNewPlayerId(e.target.value)}
                className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Имя (необязательно)</span>
              <input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
                placeholder="Как в таблице"
              />
            </label>
            <button
              type="submit"
              disabled={loading === "add"}
              className="inline-flex justify-center rounded-xl bg-white/15 border border-white/10 text-white font-semibold px-4 py-2 text-sm hover:bg-white/25 disabled:opacity-60"
            >
              {loading === "add" ? "Добавляем..." : "Добавить"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-lg font-semibold">Состав</h3>
          {currentRoster.length === 0 ? (
            <p className="text-sm text-white/60">Состав пока пустой.</p>
          ) : (
            <div className="space-y-2">
              {currentRoster.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {player.fullName || `Игрок ${player.userId}`}
                    </p>
                    <p className="text-[11px] text-white/60">
                      {player.isCaptain ? "Капитан" : "Игрок"} · ID {player.userId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!player.isCaptain ? (
                      <button
                        type="button"
                        disabled={loading === "remove"}
                        onClick={() => removePlayer(player.userId)}
                        className="text-[11px] rounded-lg border border-red-400/40 bg-red-500/10 px-2 py-1 text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                      >
                        Удалить
                      </button>
                    ) : (
                      <span className="rounded-full border border-vz_green/40 bg-vz_green/15 px-2 py-1 text-[11px] text-vz_green">
                        Капитан
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
