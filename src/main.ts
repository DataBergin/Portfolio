import { initArt } from "./art";
import { getById } from "./dom";
import { initCounters } from "./counters";
import { initFilterBarScroll } from "./filter-bar";
import { initFilters } from "./filters";
import { HeroArt } from "./hero-art";
import { initParallax } from "./parallax";
import { initCardStagger, initScrollAnimations } from "./scroll-animations";
import { initSmoothScroll } from "./smooth-scroll";
import { initTypewriter } from "./typewriter";

function start(): void {
  new HeroArt(getById("heroCanvas", HTMLCanvasElement), getById("hero", HTMLElement));
  initArt();

  initScrollAnimations();
  initCardStagger();
  initFilters();
  initCounters();
  initTypewriter();
  initFilterBarScroll();
  initParallax();
  initSmoothScroll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
