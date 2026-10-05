import { getById } from "./dom";

export function initParallax(): void {
  const canvas = getById("heroCanvas", HTMLCanvasElement);
  const hero = getById("hero", HTMLElement);
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const h = hero.offsetHeight;

        if (scrolled < h) {
          canvas.style.transform = `translateY(${scrolled * 0.25}px)`;
          canvas.style.opacity = String(1 - scrolled / h);
        }

        ticking = false;
      });
      ticking = true;
    }
  });
}
