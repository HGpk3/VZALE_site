export type TournamentStatus =
  | "draft"
  | "announced"
  | "registration_open"
  | "closed"
  | "running"
  | "finished"
  | "archived";

export const allowedStatuses: TournamentStatus[] = [
  "draft",
  "announced",
  "registration_open",
  "closed",
  "running",
  "finished",
  "archived",
];

export const statusPriority: Record<TournamentStatus, number> = {
  registration_open: 0,
  announced: 1,
  running: 2,
  finished: 3,
  closed: 4,
  draft: 5,
  archived: 6,
};

export function normalizeStatus(
  status: string | null | undefined
): TournamentStatus | null {
  if (!status) return null;
  if (allowedStatuses.includes(status as TournamentStatus)) {
    return status as TournamentStatus;
  }
  return null;
}
