/**
 * Lightweight wrapper around HTTP requests to the external tournament API.
 *
 * Locally, set `API_URL=http://localhost:8000` (or your FastAPI/Flask port)
 * in a `.env.local` file so Next.js can read it on the server.
 * On Vercel, configure `API_URL` (and `NEXT_PUBLIC_API_URL` if you also fetch
 * on the client) in the project settings. Client-side bundles can only read
 * `NEXT_PUBLIC_` prefixed variables.
 */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiFetchOptions extends Omit<RequestInit, "method"> {
  method?: HttpMethod;
  /**
   * If you need to send JSON, pass the raw object here and it will be stringified.
   */
  json?: unknown;
}

const sanitizeBaseUrl = (url: string) => url.replace(/\/$/, "");

function resolveBaseUrl() {
  const serverUrl = process.env.API_URL;
  const clientUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== "undefined") {
    return clientUrl ?? serverUrl ?? "";
  }
  return serverUrl ?? clientUrl ?? "";
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T | null> {
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    console.error("[API] Base URL is not configured. Set API_URL/NEXT_PUBLIC_API_URL.");
    return null;
  }

  const { json, headers, method = "GET", ...rest } = options;

  const requestInit: RequestInit = {
    method,
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(json ? { body: JSON.stringify(json) } : {}),
  };

  const url = `${sanitizeBaseUrl(baseUrl)}${path}`;

  try {
    const response = await fetch(url, requestInit);
    if (!response.ok) {
      console.error(`[API] ${method} ${url} failed:`, response.status, response.statusText);
      return null;
    }
    if (response.status === 204) return null;
    return (await response.json()) as T;
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
};

export type MatchSummary = {
  id: number;
  tournamentId: number;
  startedAt: string | null;
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
  return apiFetch<TournamentSummary[]>("/api/tournaments");
}

export async function fetchTeams() {
  return apiFetch<TeamSummary[]>("/api/teams");
}

export async function fetchMatches() {
  return apiFetch<MatchSummary[]>("/api/matches");
}

export async function fetchLastTeamForCaptain(telegramId: number) {
  if (!telegramId) return null;
  return apiFetch<{ name: string; tournamentId?: number; members: TeamMemberRow[] } | null>(
    `/api/users/${encodeURIComponent(telegramId)}/last-team`
  );
}
