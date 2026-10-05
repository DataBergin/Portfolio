import { getById } from "./dom";

export function initFilterBarScroll(): void {
  const bar = getById("filterBar", HTMLElement);
  const sentinel = getById("about", HTMLElement);

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry === undefined) return;

      bar.classList.toggle("scrolled", !entry.isIntersecting);
    },
    { threshold: 0 },
  );

  observer.observe(sentinel);
}
