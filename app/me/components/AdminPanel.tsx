"use client";

import { useEffect, useRef, useState } from "react";
import { TournamentOption } from "./TournamentSignup";

interface AdminPanelProps {
  tournaments: TournamentOption[];
}

type TeamWithRoster = {
  id: number;
  name: string;
  tournamentId: number | null;
  members: {
    userId: number;
    fullName: string | null;
  }[];
};

type PlayerRow = {
  userId: string;
  teamId: string;
  points: string;
  threes: string;
  assists: string;
  rebounds: string;
  steals: string;
  blocks: string;
  fouls: string;
  turnovers: string;
  minutes: string;
};

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
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchForm, setMatchForm] = useState({
    tournamentId: tournaments[0]?.id?.toString() || "",
    stage: "",
    status: "finished",
    teamHomeId: "",
    teamAwayId: "",
    scoreHome: "",
    scoreAway: "",
  });
  const [teams, setTeams] = useState<TeamWithRoster[]>([]);
  const [teamRosters, setTeamRosters] = useState<Record<number, TeamWithRoster["members"]>>({});
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerRow[]>([
    {
      userId: "",
      teamId: "",
      points: "",
      threes: "",
      assists: "",
      rebounds: "",
      steals: "",
      blocks: "",
      fouls: "",
      turnovers: "",
      minutes: "",
    },
  ]);
  const lastLoadedTournamentId = useRef<string | null>(null);

  useEffect(() => {
    const loadTeams = async (tournamentId: string) => {
      if (!tournamentId) {
        setTeams([]);
        setTeamRosters({});
        return;
      }

      setTeamsLoading(true);
      try {
        const res = await fetch(
          `/api/admin/matches/options?tournamentId=${tournamentId}`
        );
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Не удалось загрузить команды");
        }

        const rosterMap: Record<number, TeamWithRoster["members"]> = {};
        (data.teams as TeamWithRoster[]).forEach((team) => {
          rosterMap[team.id] = team.members;
        });

        setTeams(data.teams as TeamWithRoster[]);
        setTeamRosters(rosterMap);

        setMatchForm((prev) => {
          let nextHome = prev.teamHomeId;
          let nextAway = prev.teamAwayId;

          if (data.teams?.length) {
            const firstTeam = data.teams[0];
            if (
              !nextHome ||
              !data.teams.some((t: TeamWithRoster) => t.id.toString() === nextHome)
            ) {
              nextHome = firstTeam.id.toString();
            }

            if (
              !nextAway ||
              nextAway === nextHome ||
              !data.teams.some((t: TeamWithRoster) => t.id.toString() === nextAway)
            ) {
              const alt = (data.teams as TeamWithRoster[]).find(
                (t) => t.id.toString() !== nextHome
              );
              nextAway = alt ? alt.id.toString() : "";
            }
          } else {
            nextHome = "";
            nextAway = "";
          }

          return { ...prev, teamHomeId: nextHome, teamAwayId: nextAway };
        });

        setPlayerStats((prev) => {
          const hasData = prev.some(
            (ps) =>
              ps.userId ||
              ps.points ||
              ps.assists ||
              ps.rebounds ||
              ps.steals ||
              ps.blocks ||
              ps.threes ||
              ps.fouls ||
              ps.turnovers ||
              ps.minutes
          );

          if (hasData) return prev;

          const autoRows: PlayerRow[] = [];
          const addRoster = (teamId: string) => {
            if (!teamId) return;
            const roster = rosterMap[Number(teamId)] || [];
            roster.forEach((player) => {
              autoRows.push({
                userId: player.userId.toString(),
                teamId,
                points: "",
                threes: "",
                assists: "",
                rebounds: "",
                steals: "",
                blocks: "",
                fouls: "",
                turnovers: "",
                minutes: "",
              });
            });
          };

          addRoster(matchForm.teamHomeId || data.teams?.[0]?.id?.toString() || "");
          addRoster(matchForm.teamAwayId || data.teams?.[1]?.id?.toString() || "");

          return autoRows.length ? autoRows : prev;
        });
      } catch (err) {
        console.error("[admin] failed to load teams", err);
      } finally {
        setTeamsLoading(false);
      }
    };

    const tournamentId = matchForm.tournamentId || tournaments[0]?.id?.toString();
    if (!tournamentId) return;

    if (lastLoadedTournamentId.current === tournamentId) return;
    lastLoadedTournamentId.current = tournamentId;

    loadTeams(tournamentId);
  }, [matchForm.tournamentId, matchForm.teamAwayId, matchForm.teamHomeId, tournaments]);

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

  function updateStatField(
    index: number,
    field: string,
    value: string
  ) {
    setPlayerStats((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
        ...(field === "teamId" ? { userId: "" } : {}),
      };
      return next;
    });
  }

  function addPlayerRow() {
    setPlayerStats((prev) => [
      ...prev,
      {
        userId: "",
        teamId: matchForm.teamHomeId || matchForm.teamAwayId || "",
        points: "",
        threes: "",
        assists: "",
        rebounds: "",
        steals: "",
        blocks: "",
        fouls: "",
        turnovers: "",
        minutes: "",
      },
    ]);
  }

  function removePlayerRow(index: number) {
    setPlayerStats((prev) => prev.filter((_, i) => i !== index));
  }

  function autofillRosters() {
    const rows: PlayerRow[] = [];
    const addRoster = (teamId: string) => {
      if (!teamId) return;
      const roster = teamRosters[Number(teamId)] || [];
      roster.forEach((player) => {
        rows.push({
          userId: player.userId.toString(),
          teamId,
          points: "",
          threes: "",
          assists: "",
          rebounds: "",
          steals: "",
          blocks: "",
          fouls: "",
          turnovers: "",
          minutes: "",
        });
      });
    };

    addRoster(matchForm.teamHomeId);
    addRoster(matchForm.teamAwayId);

    if (rows.length === 0) return;
    setPlayerStats(rows);
  }

  async function submitMatch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setMatchLoading(true);
    try {
      const teamHome = teams.find((t) => t.id.toString() === matchForm.teamHomeId);
      const teamAway = teams.find((t) => t.id.toString() === matchForm.teamAwayId);

      if (!teamHome || !teamAway) {
        throw new Error("Выберите обе команды из списка турнира");
      }

      const preparedStats = playerStats
        .map((ps) => ({
          userId: ps.userId.trim(),
          teamId: ps.teamId.trim(),
          points: ps.points.trim(),
          threes: ps.threes.trim(),
          assists: ps.assists.trim(),
          rebounds: ps.rebounds.trim(),
          steals: ps.steals.trim(),
          blocks: ps.blocks.trim(),
          fouls: ps.fouls.trim(),
          turnovers: ps.turnovers.trim(),
          minutes: ps.minutes.trim(),
        }))
        .filter((ps) => ps.userId && ps.teamId);

      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...matchForm,
          tournamentId: Number(matchForm.tournamentId),
          teamHomeName: teamHome.name,
          teamAwayName: teamAway.name,
          scoreHome:
            matchForm.scoreHome === "" ? null : Number(matchForm.scoreHome),
          scoreAway:
            matchForm.scoreAway === "" ? null : Number(matchForm.scoreAway),
          playerStats: preparedStats.map((ps) => ({
            ...ps,
            teamName:
              teams.find((t) => t.id.toString() === ps.teamId)?.name || "",
            userId: Number(ps.userId),
            points: ps.points === "" ? 0 : Number(ps.points),
            threes: ps.threes === "" ? 0 : Number(ps.threes),
            assists: ps.assists === "" ? 0 : Number(ps.assists),
            rebounds: ps.rebounds === "" ? 0 : Number(ps.rebounds),
            steals: ps.steals === "" ? 0 : Number(ps.steals),
            blocks: ps.blocks === "" ? 0 : Number(ps.blocks),
            fouls: ps.fouls === "" ? 0 : Number(ps.fouls),
            turnovers: ps.turnovers === "" ? 0 : Number(ps.turnovers),
            minutes: ps.minutes === "" ? 0 : Number(ps.minutes),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось сохранить матч");
      }

      setMessage(`Матч сохранён (ID ${data.matchId}). Статистика обновлена.`);
      setMatchForm({
        tournamentId: tournaments[0]?.id?.toString() || "",
        stage: "",
        status: "finished",
        teamHomeId: "",
        teamAwayId: "",
        scoreHome: "",
        scoreAway: "",
      });
      setPlayerStats([
        {
          userId: "",
          teamId: "",
          points: "",
          threes: "",
          assists: "",
          rebounds: "",
          steals: "",
          blocks: "",
          fouls: "",
          turnovers: "",
          minutes: "",
        },
      ]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Неизвестная ошибка");
      }
    } finally {
      setMatchLoading(false);
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
                    {(t.status ? statusLabels[t.status] || t.status : "Без статуса")}
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

      <form
        onSubmit={submitMatch}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Админ</p>
          <h3 className="text-lg font-semibold">Добавить матч и статистику</h3>
          <p className="text-sm text-white/70">
            Матч сразу попадает в таблицу бота вместе с очками игроков и обновляет
            их суммарную статистику по турниру.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Турнир</span>
            <select
              value={matchForm.tournamentId}
              onChange={(e) => {
                setMatchForm((prev) => ({
                  ...prev,
                  tournamentId: e.target.value,
                  teamHomeId: "",
                  teamAwayId: "",
                }));
                setPlayerStats([
                  {
                    userId: "",
                    teamId: "",
                    points: "",
                    threes: "",
                    assists: "",
                    rebounds: "",
                    steals: "",
                    blocks: "",
                    fouls: "",
                    turnovers: "",
                    minutes: "",
                  },
                ]);
              }}
              required
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            >
              <option value="" disabled>
                Выберите турнир
              </option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id} className="bg-black">
                  #{t.id} — {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Стадия/раунд</span>
            <input
              value={matchForm.stage}
              onChange={(e) =>
                setMatchForm((prev) => ({ ...prev, stage: e.target.value }))
              }
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
              placeholder="Группа A, плей-офф, финал..."
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Домашняя команда</span>
            <select
              value={matchForm.teamHomeId}
              onChange={(e) =>
                setMatchForm((prev) => ({ ...prev, teamHomeId: e.target.value }))
              }
              required
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            >
              <option value="" className="bg-black" disabled>
                Выберите команду
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id} className="bg-black">
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Гостевая команда</span>
            <select
              value={matchForm.teamAwayId}
              onChange={(e) =>
                setMatchForm((prev) => ({ ...prev, teamAwayId: e.target.value }))
              }
              required
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            >
              <option value="" className="bg-black" disabled>
                Выберите команду
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id} className="bg-black">
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Счёт хозяев</span>
            <input
              type="number"
              value={matchForm.scoreHome}
              onChange={(e) =>
                setMatchForm((prev) => ({ ...prev, scoreHome: e.target.value }))
              }
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Счёт гостей</span>
            <input
              type="number"
              value={matchForm.scoreAway}
              onChange={(e) =>
                setMatchForm((prev) => ({ ...prev, scoreAway: e.target.value }))
              }
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Статус</span>
            <select
              value={matchForm.status}
              onChange={(e) =>
                setMatchForm((prev) => ({ ...prev, status: e.target.value }))
              }
              className="rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-white text-sm focus:border-vz_green focus:outline-none"
            >
              <option value="scheduled" className="bg-black">
                Запланирован
              </option>
              <option value="running" className="bg-black">
                Идёт матч
              </option>
              <option value="finished" className="bg-black">
                Завершён
              </option>
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold">Статистика игроков</h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={autofillRosters}
                className="text-xs px-3 py-1 rounded-full border border-white/20 hover:border-vz_green hover:text-vz_green transition"
              >
                Автозаполнить состав
              </button>
              <button
                type="button"
                onClick={addPlayerRow}
                className="text-xs px-3 py-1 rounded-full border border-white/20 hover:border-vz_green hover:text-vz_green transition"
              >
                + Добавить игрока
              </button>
            </div>
          </div>

          <p className="text-xs text-white/60">
            Команды и ростеры подтягиваются из выбранного турнира. Можно
            скорректировать статистику перед сохранением, не вводя ID вручную.
          </p>
          {teamsLoading && (
            <p className="text-xs text-vz_green">Обновляем список команд и игроков...</p>
          )}

          <div className="space-y-2">
            {playerStats.map((row, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.1fr,1.3fr,repeat(5,minmax(88px,1fr))] items-end rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-white/60">Команда</span>
                  <select
                    value={row.teamId}
                    onChange={(e) => updateStatField(index, "teamId", e.target.value)}
                    className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                  >
                    <option value="" className="bg-black">
                      Выберите команду
                    </option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} className="bg-black">
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-white/60">Игрок</span>
                  <select
                    value={row.userId}
                    onChange={(e) => updateStatField(index, "userId", e.target.value)}
                    className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                  >
                    <option value="" className="bg-black">
                      Выберите игрока
                    </option>
                    {(teamRosters[Number(row.teamId)] || [])
                      .filter((p) => p.userId)
                      .map((player) => (
                        <option
                          key={`${row.teamId}-${player.userId}`}
                          value={player.userId}
                          className="bg-black"
                        >
                          {player.fullName || "Игрок"} (ID {player.userId})
                        </option>
                      ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-white/60">Очки</span>
                  <input
                    type="number"
                    value={row.points}
                    onChange={(e) => updateStatField(index, "points", e.target.value)}
                    className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-white/60">3-очки</span>
                  <input
                    type="number"
                    value={row.threes}
                    onChange={(e) => updateStatField(index, "threes", e.target.value)}
                    className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-white/60">Пасы</span>
                  <input
                    type="number"
                    value={row.assists}
                    onChange={(e) => updateStatField(index, "assists", e.target.value)}
                    className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-white/60">Подборы</span>
                  <input
                    type="number"
                    value={row.rebounds}
                    onChange={(e) => updateStatField(index, "rebounds", e.target.value)}
                    className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                  />
                </label>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => removePlayerRow(index)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-white/20 text-white/70 hover:border-red-400 hover:text-red-200 transition"
                  >
                    Удалить
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:col-span-3 xl:col-span-7">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Перехваты</span>
                    <input
                      type="number"
                      value={row.steals}
                      onChange={(e) => updateStatField(index, "steals", e.target.value)}
                      className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Блоки</span>
                    <input
                      type="number"
                      value={row.blocks}
                      onChange={(e) => updateStatField(index, "blocks", e.target.value)}
                      className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Фолы</span>
                    <input
                      type="number"
                      value={row.fouls}
                      onChange={(e) => updateStatField(index, "fouls", e.target.value)}
                      className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Потери</span>
                    <input
                      type="number"
                      value={row.turnovers}
                      onChange={(e) => updateStatField(index, "turnovers", e.target.value)}
                      className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Минуты</span>
                    <input
                      type="number"
                      value={row.minutes}
                      onChange={(e) => updateStatField(index, "minutes", e.target.value)}
                      className="rounded-lg bg-black/20 border border-white/15 px-2 py-1 text-white text-sm focus:border-vz_green focus:outline-none min-w-0"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={matchLoading}
          className="inline-flex justify-center rounded-xl bg-vz_green text-black font-semibold px-4 py-2 text-sm hover:brightness-110 disabled:opacity-60"
        >
          {matchLoading ? "Сохраняем..." : "Сохранить матч"}
        </button>
      </form>
    </div>
  );
}
