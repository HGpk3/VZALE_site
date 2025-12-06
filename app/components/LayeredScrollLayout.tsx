"use client";

import React from "react";
import { useSectionInView } from "../hooks/useSectionInView";

export type Section = {
  id: string;
  title: string;
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
    <div className="relative min-h-screen overflow-y-auto bg-[#05070e] text-white snap-y snap-mandatory">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5"
      />
      <div className="relative">
        {sections.map((section, index) => {
          const isActive = section.id === activeId || (activeId === null && index === 0);
          const isBehindActive = activeIndex > index;

          return (
            <section
              key={section.id}
              ref={register(section.id)}
              data-section-id={section.id}
              style={{
                zIndex: index + 1,
                backgroundColor: section.backgroundColor ?? "#0b0d16",
              }}
              className="sticky top-0 flex h-screen snap-start items-center justify-center px-6 transition-all duration-500 ease-out"
            >
              <div
                className={`mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-lg transition-all duration-500 ease-out md:p-12 ${
                  isActive
                    ? "opacity-100 translate-y-0 scale-100"
                    : isBehindActive
                      ? "opacity-70 -translate-y-2 scale-[0.99]"
                      : "opacity-80 translate-y-4 scale-[0.99]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vz_green">{section.title}</p>
                <div className="mt-4 space-y-4 text-left md:space-y-6">
                  <h2 className="text-center text-3xl font-black leading-tight md:text-4xl">{section.title}</h2>
                  <div className="space-y-3 text-sm text-white/80 md:text-base">{section.content}</div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
