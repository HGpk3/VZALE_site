import { fetchLastTeamForCaptain as fetchLastTeamForCaptainApi, fetchTournaments } from "./api";

export type TournamentRow = {
  id: number;
  name: string;
  status: string | null;
  dateStart: string | null;
  venue: string | null;
};

export type TeamMemberRow = {
  userId: number;
  role: string | null;
  status: string | null;
  fullName: string | null;
};

export async function fetchAllTournaments(): Promise<TournamentRow[]> {
  const tournaments = await fetchTournaments();
  return tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status ?? null,
    dateStart: t.dateStart ?? null,
    venue: t.venue ?? null,
  }));
}

export async function fetchOpenTournaments(): Promise<TournamentRow[]> {
  const tournaments = await fetchTournaments();
  return tournaments
    .filter((t) => t.status === "registration_open")
    .map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status ?? null,
      dateStart: t.dateStart ?? null,
      venue: t.venue ?? null,
    }));
}

export async function fetchLastTeamForCaptain(captainId: number): Promise<{
  teamId: number;
  name: string;
  tournamentId: number;
  members: TeamMemberRow[];
} | null> {
  const lastTeam = await fetchLastTeamForCaptainApi(captainId);
  if (!lastTeam) return null;

  return {
    teamId: captainId,
    name: lastTeam.name,
    tournamentId: lastTeam.tournamentId ?? captainId,
    members: (lastTeam.members ?? []).map((m) => ({
      userId: m.userId,
      role: m.role,
      status: m.status,
      fullName: m.fullName,
    })),
  };
}
