import { getDb } from "./db";

export type TournamentRow = {
  id: number;
  name: string;
  status: string | null;
  dateStart: string | null;
  venue: string | null;
  settingsJson?: string | null;
};

export type TeamMemberRow = {
  userId: number;
  role: string | null;
  status: string | null;
  fullName: string | null;
};

export function fetchAllTournaments(): TournamentRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, status, date_start as dateStart, venue, settings_json as settingsJson FROM tournaments ORDER BY id DESC"
    )
    .all() as TournamentRow[];
}

export function fetchOpenTournaments(): TournamentRow[] {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT id, name, status, date_start as dateStart, venue
      FROM tournaments
      WHERE status = 'registration_open'
      ORDER BY date_start IS NULL, date_start ASC, id DESC
    `
    )
    .all() as TournamentRow[];
}

export function fetchLastTeamForCaptain(captainId: number): {
  teamId: number;
  name: string;
  tournamentId: number;
  members: TeamMemberRow[];
} | null {
  const db = getDb();
  const lastTeam = db
    .prepare(
      "SELECT id, name, tournament_id as tournamentId FROM teams_new WHERE captain_user_id = ? ORDER BY id DESC LIMIT 1"
    )
    .get(captainId) as { id: number; name: string; tournamentId: number } | undefined;

  if (!lastTeam) return null;

  const members = db
    .prepare(
      `
        SELECT
          tm.user_id AS userId,
          tm.role,
          tm.status,
          u.full_name AS fullName
        FROM team_members tm
        LEFT JOIN users u ON u.user_id = tm.user_id
        WHERE tm.team_id = ?
        ORDER BY tm.role DESC, tm.user_id ASC
      `
    )
    .all(lastTeam.id) as TeamMemberRow[];

  return { teamId: lastTeam.id, name: lastTeam.name, tournamentId: lastTeam.tournamentId, members };
}
