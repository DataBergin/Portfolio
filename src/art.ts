import { queryAll } from "./dom";

const artwork = import.meta.glob<string>("./graphics/*.svg", { query: "?raw", import: "default", eager: true });

/** Drops each illustration (src/graphics/<name>.svg) into its card's [data-art="<name>"] slot. */
export function initArt(): void {
  for (const slot of queryAll("[data-art]", HTMLElement)) {
    const svg = artwork[`./graphics/${slot.dataset.art}.svg`];

    if (svg !== undefined) slot.innerHTML = svg.replace(/<!--[\s\S]*?-->/g, "");
  }
}
