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
  const sections: Section[] = [
    {
      id: "hero",
      content: <Hero />,
    },
    {
      id: "about",
      content: <About />,
    },
    {
      id: "upcoming",
      content: <UpcomingTournament />,
    },
    {
      id: "features",
      content: <Features />,
    },
    {
      id: "teams",
      content: <TeamsAndPlayers searchParams={searchParams} />,
      backgroundColor: "#060710",
    },
    {
      id: "footer",
      content: <Footer />,
      backgroundColor: "#05060b",
    },
  ];

  return (
    <main className="flex flex-col min-h-screen bg-vz-gradient">
      <LayeredScrollLayout sections={sections} />
    </main>
  );
}
