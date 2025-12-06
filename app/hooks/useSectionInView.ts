"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSectionInView(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(
    sectionIds[0] ?? null,
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          const id = visible[0].target.getAttribute("data-section-id");
          if (id) {
            setActiveId(id);
          }
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -10% 0px",
      },
    );

    observerRef.current = observer;

    elementsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [sectionIds.join(",")]);

  const register = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      const currentObserver = observerRef.current;
      const trackedElements = elementsRef.current;
      const existing = trackedElements.get(id);

      if (existing && currentObserver) {
        currentObserver.unobserve(existing);
      }

      if (node) {
        trackedElements.set(id, node);
        currentObserver?.observe(node);
      } else {
        trackedElements.delete(id);
      }
    },
    [],
  );

  return { activeId, register };
}
