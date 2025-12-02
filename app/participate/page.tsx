import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ParticipatePage() {
  const cookieStore = await cookies();
  const telegramId = cookieStore.get("vzale_telegram_id")?.value;
  const destination = telegramId ? "/me" : "/login";

  redirect(destination);
}
