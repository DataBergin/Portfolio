import { queryAll } from "./dom";

export function initCounters(): void {
  const counters = queryAll(".stat-number", HTMLElement);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;

        if (!entry.isIntersecting || !(el instanceof HTMLElement)) continue;

        const target = Number.parseInt(el.dataset.target ?? "", 10);
        let current = 0;

        const step = (): void => {
          if (current < target) {
            current++;
            el.textContent = String(current);
            setTimeout(step, 180);
          }
        };

        step();
        observer.unobserve(el);
      }
    },
    { threshold: 0.5 },
  );

  for (const c of counters) observer.observe(c);
}
