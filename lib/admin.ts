const DEFAULT_ADMIN_IDS = [409436763, 469460286];

export function getAdminIds() {
  const fromEnv = process.env.ADMIN_TELEGRAM_IDS;
  if (fromEnv) {
    return fromEnv
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !Number.isNaN(id));
  }
  return DEFAULT_ADMIN_IDS;
}

export function isAdmin(telegramId: number | null | undefined) {
  if (!telegramId) return false;
  return getAdminIds().includes(telegramId);
}
