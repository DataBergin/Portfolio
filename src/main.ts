import { getById } from "./dom";
import { initCounters } from "./counters";
import { initFilterBarScroll } from "./filter-bar";
import { initFilters } from "./filters";
import { initParallax } from "./parallax";
import { ParticleField } from "./particle-field";
import { initCardStagger, initScrollAnimations } from "./scroll-animations";
import { initSmoothScroll } from "./smooth-scroll";
import { initTypewriter } from "./typewriter";

function start(): void {
  const pf = new ParticleField(getById("heroCanvas", HTMLCanvasElement));
  pf.animate();

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
