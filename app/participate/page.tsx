import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function ParticipatePage() {
  const telegramId = cookies().get("vzale_telegram_id")?.value;
  const destination = telegramId ? "/me" : "/login";

  redirect(destination);
}
