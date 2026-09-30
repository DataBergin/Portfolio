import { queryAll } from "./dom";

export function initSmoothScroll(): void {
  for (const a of queryAll('a[href^="#"]', HTMLAnchorElement)) {
    a.addEventListener("click", (e) => {
      e.preventDefault();

      const hash = a.getAttribute("href")?.slice(1) ?? "";
      const target = document.getElementById(hash);

      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}
