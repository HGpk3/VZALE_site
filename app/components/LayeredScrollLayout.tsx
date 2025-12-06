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
    <div className="relative min-h-screen overflow-y-auto bg-vz-gradient text-white snap-y snap-mandatory">
      {sections.map((section, index) => {
        const isActive = section.id === activeId || (activeId === null && index === 0);
        const isBehindActive = activeIndex > index;

        const stateClass = isActive
          ? "opacity-100 translate-y-0 scale-100"
          : isBehindActive
            ? "opacity-75 -translate-y-2 scale-[0.99]"
            : "opacity-80 translate-y-6 scale-[0.98]";

        return (
          <section
            key={section.id}
            ref={register(section.id)}
            data-section-id={section.id}
            style={{
              zIndex: index + 1,
              backgroundColor: section.backgroundColor ?? "transparent",
            }}
            className={`sticky top-0 h-screen snap-start transition-all duration-500 ease-out ${stateClass}`}
          >
            <div className="relative flex h-full w-full items-stretch justify-center overflow-hidden">
              <div className="relative h-full w-full">{section.content}</div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
            </div>
          </section>
        );
      })}
    </div>
  );
}
