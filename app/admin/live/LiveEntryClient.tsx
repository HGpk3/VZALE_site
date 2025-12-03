"use client";

import { useEffect, useMemo, useState } from "react";

import { TournamentOption } from "@/app/me/components/TournamentSignup";

type PlayerStub = {
  userId: number;
  fullName: string | null;
};

type PlayerStat = {
  userId: number;
  fullName: string | null;
  teamName: string;
  points: number;
  threes: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
  minutes: number;
};

type LiveMatch = {
  id: number;
  tournamentId: number;
  stage: string | null;
  status: string | null;
  startAt: string | null;
  court: string | null;
  teamHomeName: string;
  teamAwayName: string;
  scoreHome: number | null;
  scoreAway: number | null;
  homeRoster: PlayerStub[];
  awayRoster: PlayerStub[];
  stats: PlayerStat[];
};

const emptyStats = (teamName: string) =>
  ({
    teamName,
    points: 0,
    threes: 0,
    assists: 0,
    rebounds: 0,
    steals: 0,
    blocks: 0,
    fouls: 0,
    turnovers: 0,
    minutes: 0,
  } satisfies Omit<PlayerStat, "userId" | "fullName">);

const statButtons: { key: keyof PlayerStat; label: string; value: number }[] = [
  { key: "points", label: "+1", value: 1 },
  { key: "points", label: "+2", value: 2 },
  { key: "points", label: "+3", value: 3 },
  { key: "assists", label: "Ассист", value: 1 },
  { key: "rebounds", label: "Подбор", value: 1 },
  { key: "steals", label: "Перехват", value: 1 },
  { key: "blocks", label: "Блок", value: 1 },
  { key: "fouls", label: "Фол", value: 1 },
  { key: "turnovers", label: "Потеря", value: 1 },
];

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toString();
}

export function LiveEntryClient({
  tournaments,
}: {
  tournaments: TournamentOption[];
}) {
  const [selectedTournament, setSelectedTournament] = useState<string>(
    tournaments[0]?.id?.toString() || ""
  );
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState("running");
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [playerStats, setPlayerStats] = useState<Record<number, PlayerStat>>({});

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const loadMatches = async (tournamentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/live/options?tournamentId=${tournamentId}`
      );
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось получить матчи");
      }

      const list = (data.matches as LiveMatch[]) || [];
      setMatches(list);

      const preferredMatch = list[0]?.id ?? null;
      setSelectedMatchId(preferredMatch);
      if (preferredMatch) {
        const match = list.find((m) => m.id === preferredMatch)!;
        hydrateFromMatch(match);
      } else {
        setPlayerStats({});
        setScore({ home: 0, away: 0 });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ошибка загрузки матчей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTournament) {
      loadMatches(selectedTournament);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament]);

  const hydrateFromMatch = (match: LiveMatch) => {
    const initial: Record<number, PlayerStat> = {};
    const applyRoster = (roster: PlayerStub[], teamName: string) => {
      for (const player of roster) {
        initial[player.userId] = {
          userId: player.userId,
          fullName: player.fullName,
          ...emptyStats(teamName),
        };
      }
    };

    applyRoster(match.homeRoster, match.teamHomeName);
    applyRoster(match.awayRoster, match.teamAwayName);

    for (const stat of match.stats) {
      initial[stat.userId] = {
        userId: stat.userId,
        fullName: stat.fullName,
        teamName: stat.teamName,
        points: stat.points ?? 0,
        threes: stat.threes ?? 0,
        assists: stat.assists ?? 0,
        rebounds: stat.rebounds ?? 0,
        steals: stat.steals ?? 0,
        blocks: stat.blocks ?? 0,
        fouls: stat.fouls ?? 0,
        turnovers: stat.turnovers ?? 0,
        minutes: stat.minutes ?? 0,
      };
    }

    setPlayerStats(initial);
    setStatus(match.status || "running");
    setScore({
      home: match.scoreHome ?? 0,
      away: match.scoreAway ?? 0,
    });
  };

  const addStat = (
    userId: number,
    teamName: string,
    field: keyof PlayerStat,
    value: number
  ) => {
    setPlayerStats((prev) => {
      const current = prev[userId] || {
        userId,
        fullName: `Игрок ${userId}`,
        ...emptyStats(teamName),
      };

      const nextValue = (current[field] || 0) + value;
      const updated: PlayerStat = {
        ...current,
        teamName,
        [field]: nextValue,
      } as PlayerStat;

      return { ...prev, [userId]: updated };
    });

    if (field === "points") {
      setScore((prev) => ({
        home:
          teamName === selectedMatch?.teamHomeName
            ? prev.home + value
            : prev.home,
        away:
          teamName === selectedMatch?.teamAwayName
            ? prev.away + value
            : prev.away,
      }));

      if (value === 3) {
        setPlayerStats((prev) => {
          const current = prev[userId];
          if (!current) return prev;
          return {
            ...prev,
            [userId]: { ...current, threes: (current.threes || 0) + 1 },
          };
        });
      }
    }
  };

  const saveStats = async () => {
    if (!selectedMatch) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        matchId: selectedMatch.id,
        tournamentId: selectedMatch.tournamentId,
        status,
        scoreHome: score.home,
        scoreAway: score.away,
        playerStats: Object.values(playerStats).map((stat) => ({
          ...stat,
        })),
      };

      const res = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось сохранить статистику");
      }
      setMessage("Статистика сохранена и записана в протокол.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const fouls = useMemo(() => {
    const home = Object.values(playerStats)
      .filter((p) => p.teamName === selectedMatch?.teamHomeName)
      .reduce((acc, p) => acc + (p.fouls || 0), 0);
    const away = Object.values(playerStats)
      .filter((p) => p.teamName === selectedMatch?.teamAwayName)
      .reduce((acc, p) => acc + (p.fouls || 0), 0);
    return { home, away };
  }, [playerStats, selectedMatch?.teamAwayName, selectedMatch?.teamHomeName]);

  return (
    <div className="relative z-10 space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/60">
              Турнир
            </label>
            <select
              value={selectedTournament}
              onChange={(e) => {
                setSelectedTournament(e.target.value);
                setSelectedMatchId(null);
              }}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vz_green"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/60">
              Матч
            </label>
            <select
              value={selectedMatchId ?? ""}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setSelectedMatchId(newId || null);
                const match = matches.find((m) => m.id === newId);
                if (match) hydrateFromMatch(match);
              }}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vz_green"
            >
              {matches.length === 0 && <option value="">Матчи не найдены</option>}
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.id} • {m.teamHomeName} vs {m.teamAwayName} {" "}
                  {m.stage ? `(${m.stage})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/60">
              Статус матча
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vz_green"
            >
              <option value="running">Идёт</option>
              <option value="scheduled">Запланирован</option>
              <option value="finished">Завершён</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-vz_green/50 bg-vz_green/10 px-4 py-3 text-sm text-vz_green">
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60">Дом</p>
                <p className="text-xl font-bold">{selectedMatch?.teamHomeName || "Команда"}</p>
              </div>
              <input
                type="number"
                value={score.home}
                onChange={(e) => setScore((prev) => ({ ...prev, home: Number(e.target.value || 0) }))}
                className="w-20 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-center text-lg"
              />
            </div>
            <div className="text-sm text-white/60 space-y-1">
              <p>
                Стадия: {selectedMatch?.stage || "—"} {selectedMatch?.court ? `• Площадка ${selectedMatch.court}` : ""}
              </p>
              <p>
                Старт: {selectedMatch?.startAt || "—"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60">Гости</p>
                <p className="text-xl font-bold">{selectedMatch?.teamAwayName || "Команда"}</p>
              </div>
              <input
                type="number"
                value={score.away}
                onChange={(e) => setScore((prev) => ({ ...prev, away: Number(e.target.value || 0) }))}
                className="w-20 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-center text-lg"
              />
            </div>
            <div className="text-sm text-white/60 space-y-1">
              <p>Фолы команды: {fouls.away}</p>
              <p>Фолы команды (дом): {fouls.home}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Лайв-табло и действия</h3>
          <button
            type="button"
            onClick={saveStats}
            disabled={saving || loading || !selectedMatch}
            className="inline-flex items-center gap-2 rounded-full bg-vz_green px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить в базу"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[{
            title: selectedMatch?.teamHomeName || "Команда",
            roster: selectedMatch?.homeRoster || [],
          }, {
            title: selectedMatch?.teamAwayName || "Команда",
            roster: selectedMatch?.awayRoster || [],
          }].map((side, idx) => (
            <div key={side.title + idx} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{side.title}</h4>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                  Очки: {formatScore(idx === 0 ? score.home : score.away)}
                </span>
              </div>
              <div className="space-y-3">
                {side.roster.map((player) => {
                  const stats = playerStats[player.userId] || {
                    userId: player.userId,
                    fullName: player.fullName,
                    ...emptyStats(side.title),
                  };
                  return (
                    <div
                      key={player.userId}
                      className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{player.fullName || `Игрок ${player.userId}`}</p>
                          <p className="text-xs text-white/50">
                            {stats.points} очков • {stats.rebounds} подб. • {stats.assists} передач
                          </p>
                        </div>
                        <span className="text-xs rounded-full bg-white/10 px-2 py-1 text-white/70">
                          Фолы: {stats.fouls}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {statButtons.map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:border-vz_green/60 hover:text-vz_green"
                            onClick={() => addStat(player.userId, side.title, btn.key, btn.value)}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0c0b16] to-[#0b1218] p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Электронный протокол 3x3</p>
            <h3 className="text-lg font-semibold">Итоговая ведомость по текущему матчу</h3>
          </div>
          <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
            Статус: {status === "finished" ? "Завершён" : status === "running" ? "Идёт" : "Запланирован"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
            <p className="text-white/60">Счёт</p>
            <p className="text-2xl font-bold">
              {selectedMatch?.teamHomeName || "Дом"} {formatScore(score.home)} : {formatScore(score.away)} {" "}
              {selectedMatch?.teamAwayName || "Гости"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
            <p className="text-white/60">Фолы команды</p>
            <p>
              {selectedMatch?.teamHomeName || "Дом"}: {fouls.home}
            </p>
            <p>
              {selectedMatch?.teamAwayName || "Гости"}: {fouls.away}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
            <p className="text-white/60">Площадка и время</p>
            <p>{selectedMatch?.court || "—"}</p>
            <p>{selectedMatch?.startAt || "—"}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Игрок</th>
                <th className="px-4 py-2 text-left font-semibold">Команда</th>
                <th className="px-4 py-2 text-left font-semibold">Очки</th>
                <th className="px-4 py-2 text-left font-semibold">3-очк</th>
                <th className="px-4 py-2 text-left font-semibold">Подб</th>
                <th className="px-4 py-2 text-left font-semibold">Передачи</th>
                <th className="px-4 py-2 text-left font-semibold">Перехв</th>
                <th className="px-4 py-2 text-left font-semibold">Блоки</th>
                <th className="px-4 py-2 text-left font-semibold">Фолы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {Object.values(playerStats).map((p) => (
                <tr key={`${p.teamName}-${p.userId}`}>
                  <td className="px-4 py-2">{p.fullName || `Игрок ${p.userId}`}</td>
                  <td className="px-4 py-2 text-white/70">{p.teamName}</td>
                  <td className="px-4 py-2">{p.points}</td>
                  <td className="px-4 py-2">{p.threes}</td>
                  <td className="px-4 py-2">{p.rebounds}</td>
                  <td className="px-4 py-2">{p.assists}</td>
                  <td className="px-4 py-2">{p.steals}</td>
                  <td className="px-4 py-2">{p.blocks}</td>
                  <td className="px-4 py-2">{p.fouls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
