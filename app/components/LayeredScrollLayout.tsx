"use client";

import React from "react";
import { useSectionInView } from "../hooks/useSectionInView";

export type Section = {
  id: string;
  content: React.ReactNode;
  backgroundColor?: string;
};

type LayeredScrollLayoutProps = {
  sections: Section[];
};

export default function LayeredScrollLayout({ sections }: LayeredScrollLayoutProps) {
  const { activeId, register } = useSectionInView(sections.map((section) => section.id));
  const activeIndex = sections.findIndex((section) => section.id === activeId);

  return (
    <div className="relative h-full min-h-screen max-h-screen overflow-y-auto overflow-x-hidden bg-vz-gradient text-white snap-y snap-mandatory">
      {sections.map((section, index) => {
        const isActive = section.id === activeId || (activeId === null && index === 0);
        const isBehindActive = activeIndex > index;

        const stateClass = isActive
          ? "opacity-100 translate-y-0 scale-100"
          : isBehindActive
            ? "opacity-80 -translate-y-2 scale-[0.995]"
            : "opacity-80 translate-y-4 scale-[0.985]";

        return (
          <section
            key={section.id}
            ref={register(section.id)}
            data-section-id={section.id}
            style={{
              zIndex: index + 1,
            }}
            className={`sticky top-0 h-screen snap-start px-4 py-6 transition-all duration-500 ease-out sm:px-8 md:py-10 ${stateClass}`}
          >
            <div className="relative flex h-full w-full items-center justify-center">
              <div
                style={{ backgroundColor: section.backgroundColor ?? "rgba(255,255,255,0.04)" }}
                className="relative h-[78vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl transition-all duration-500 ease-out"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
                <div className="relative h-full w-full overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
                  <div className="flex h-full w-full flex-col gap-6">{section.content}</div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
