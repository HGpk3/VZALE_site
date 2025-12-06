"use client";

import React from "react";

export type Section = {
  id: string;
  content: React.ReactNode;
  backgroundColor?: string;
};

type LayeredScrollLayoutProps = {
  sections: Section[];
};

export default function LayeredScrollLayout({ sections }: LayeredScrollLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-vz-gradient text-white snap-y snap-mandatory">
      {sections.map((section, index) => {
        return (
          <section
            key={section.id}
            style={{
              backgroundColor: section.backgroundColor,
            }}
            className="relative flex min-h-screen w-full snap-center items-center justify-center px-4 py-12 transition-all duration-300 ease-out sm:px-8 md:py-16"
          >
            <div className="w-full max-w-6xl" aria-label={`Section ${index + 1}`}>
              {section.content}
            </div>
          </section>
        );
      })}
    </div>
  );
}
