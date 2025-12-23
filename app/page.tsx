import Hero from "./components/Hero/Hero";
import About from "./components/About/About";
import UpcomingTournament from "./components/UpcomingTournament/UpcomingTournament";
import Features from "./components/Features/Features";
import LebronWatcher from "./components/Lebron/LebronWatcher";
import TeamsAndPlayers from "./components/Teams/TeamsAndPlayers";
import Footer from "./components/Footer/Footer";

export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <main className="flex flex-col min-h-screen bg-vz-gradient">
      <Hero />
      <About />
      <UpcomingTournament />
      <Features />
      <LebronWatcher />
      <TeamsAndPlayers searchParams={searchParams} />
      <Footer />
    </main>
  );
}
