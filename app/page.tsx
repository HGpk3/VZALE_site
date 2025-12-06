import Hero from "./components/Hero/Hero";
import About from "./components/About/About";
import UpcomingTournament from "./components/UpcomingTournament/UpcomingTournament";
import Features from "./components/Features/Features";
import TeamsAndPlayers from "./components/Teams/TeamsAndPlayers";
import Footer from "./components/Footer/Footer";
import LayeredScrollLayout, { Section } from "./components/LayeredScrollLayout";

export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const layeredSections: Section[] = [
    {
      id: "hero",
      title: "Главный экран",
      content: (
        <>
          <p>
            Сразу показывает ключевое сообщение, крупный CTA и фон с брендингом. Помогает гостям понять, что
            происходит, не прокручивая ниже.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-white/80">
              <span className="mt-1 h-2 w-2 rounded-full bg-vz_green" />
              Видно дату, формат и кнопку «Вступить».
            </li>
            <li className="flex items-start gap-2 text-white/80">
              <span className="mt-1 h-2 w-2 rounded-full bg-vz_green" />
              Крупное фото или видео подчеркивает атмосферу турнира.
            </li>
          </ul>
        </>
      ),
      backgroundColor: "#0b0d16",
    },
    {
      id: "about",
      title: "О проекте",
      content: (
        <>
          <p>
            Коротко рассказываем, кто мы и почему игрокам будет интересно. Этот лист закрепляет доверие перед тем, как
            перелистывать дальше.
          </p>
          <p className="text-white/70">Команда, миссия, ключевые цифры и поддержка сообщества в одном экране.</p>
        </>
      ),
      backgroundColor: "#0c111b",
    },
    {
      id: "features",
      title: "Особенности",
      content: (
        <>
          <p>
            Лист с основными преимуществами платформы: мгновенный вход, удобное управление командой, пуши о расписании и
            оплате.
          </p>
          <p className="text-white/70">Каждый пункт раскрывается в карточке ниже, пока следующий слой накрывает предыдущий.</p>
        </>
      ),
      backgroundColor: "#0e1421",
    },
    {
      id: "tournaments",
      title: "Турниры",
      content: (
        <>
          <p>Фильтры по лигам, даты и ссылки на сетки. Все занимает весь экран, так что важные ссылки всегда под рукой.</p>
          <p className="text-white/70">При прокрутке видна предыдущая страница под слоем, создавая эффект стопки.</p>
        </>
      ),
      backgroundColor: "#10162a",
    },
    {
      id: "contacts",
      title: "Контакты",
      content: (
        <>
          <p>Финальный лист с кнопкой чата, ссылками на соцсети и адресом локации для быстрой связи.</p>
          <p className="text-white/70">Скролл доводит пользователя до нужной точки без резких переходов.</p>
        </>
      ),
      backgroundColor: "#121a2f",
    },
  ];

  return (
    <main className="flex flex-col min-h-screen bg-vz-gradient">
      <Hero />
      <About />
      <UpcomingTournament />
      <Features />
      <LayeredScrollLayout sections={layeredSections} />
      <TeamsAndPlayers searchParams={searchParams} />
      <Footer />
    </main>
  );
}
