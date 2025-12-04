/**
 * Lightweight wrapper around HTTP requests to the external tournament API.
 *
 * Locally, set `API_URL=http://localhost:8000` (or your FastAPI/Flask port)
 * in a `.env.local` file so Next.js can read it on the server.
 * On Vercel, configure `API_URL` (and `NEXT_PUBLIC_API_URL` if you also fetch
 * on the client) in the project settings. Client-side bundles can only read
 * `NEXT_PUBLIC_` prefixed variables.
 */

const sanitizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const API_BASE_URL = sanitizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://127.0.0.1:8000",
);

async function apiFetch<T>(path: string, init?: RequestInit, method: string = "GET"): Promise<T | null> {
  const url = `${API_BASE_URL}${path}`;
  const requestInit: RequestInit = { method, ...init };

  try {
    const response = await fetch(url, requestInit);

    if (!response.ok) {
      console.error(`[API] ${method} ${url} failed:`, response.status, response.statusText);
      return null;
    }

    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    console.error(`[API] ${method} ${url} error:`, error);
    return null;
  }
}

export type UserProfile = {
  id: number;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  teams?: { id: number; name: string }[];
};

export type TournamentSummary = {
  id: number;
  name: string;
  status: string | null;
  dateStart: string | null;
  venue: string | null;
};

export type TeamSummary = {
  id: number;
  name: string;
  tournamentId?: number | null;
  status?: string | null;
  playersCount?: number | null;
};

export type MatchSummary = {
  id: number;
  tournamentId: number;
  startedAt: string | null;
  teamHomeName?: string;
  teamAwayName?: string;
  scoreHome?: number | null;
  scoreAway?: number | null;
  status?: string | null;
};

export type TeamMemberRow = {
  userId: number;
  role: string | null;
  status: string | null;
  fullName: string | null;
};

export async function fetchUserByTelegramId(telegramId: string) {
  if (!telegramId) return null;
  return apiFetch<UserProfile>(`/api/users/by-telegram/${encodeURIComponent(telegramId)}`);
}

export async function fetchUserProfile<T = unknown>(telegramId: number) {
  if (!telegramId) return null;
  return apiFetch<T>(`/api/users/${encodeURIComponent(telegramId)}/profile`);
}

export async function fetchTournaments() {
  const data = await apiFetch<TournamentSummary[]>("/api/tournaments");
  return data ?? [];
}

export async function fetchTeams() {
  const data = await apiFetch<TeamSummary[]>("/api/teams");
  return data ?? [];
}

export async function fetchMatches() {
  const data = await apiFetch<MatchSummary[]>("/api/matches");
  return data ?? [];
}

export async function fetchLastTeamForCaptain(telegramId: number) {
  if (!telegramId) return null;
  return apiFetch<{ name: string; tournamentId?: number; members: TeamMemberRow[] } | null>(
    `/api/users/${encodeURIComponent(telegramId)}/last-team`
  );
}

export async function postJson<TResponse = unknown>(path: string, payload: unknown) {
  return apiFetch<TResponse>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
}

export async function getFromApi<TResponse = unknown>(path: string) {
  return apiFetch<TResponse>(path);
}
