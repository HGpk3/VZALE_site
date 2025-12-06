import Hero from "./components/Hero/Hero";
import About from "./components/About/About";
import UpcomingTournament from "./components/UpcomingTournament/UpcomingTournament";
import Features from "./components/Features/Features";
import TeamsAndPlayers from "./components/Teams/TeamsAndPlayers";
import Footer from "./components/Footer/Footer";
import LayeredScrollLayout, { Section } from "./components/LayeredScrollLayout";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

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
      content: <TeamsAndPlayers searchParams={resolvedSearchParams} />,
      backgroundColor: "#060710",
    },
    {
      id: "footer",
      content: <Footer />,
      backgroundColor: "#05060b",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-vz-gradient">
      <LayeredScrollLayout sections={sections} />
    </main>
  );
}
