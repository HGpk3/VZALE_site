import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function ParticipatePage() {
  const cookieStore = cookies();
  const telegramId = cookieStore.get("vzale_telegram_id")?.value;

  if (telegramId) {
    redirect("/me");
  }

  redirect("/login");
}
