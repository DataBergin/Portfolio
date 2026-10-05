import { queryAll } from "./dom";

export function initFilters(): void {
  const buttons = queryAll(".filter-btn", HTMLButtonElement);
  const cards = queryAll(".project-card", HTMLElement);

  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      for (const b of buttons) b.classList.remove("active");
      btn.classList.add("active");

      cards.forEach((card, i) => {
        const category = card.dataset.category;
        const match = filter === "all" || category === filter;

        if (match) {
          card.style.display = "";
          card.classList.remove("hiding");
          // Re-trigger animation
          card.classList.remove("visible");
          setTimeout(() => {
            card.classList.add("visible");
          }, i * 80);
        } else {
          card.classList.add("hiding");
          setTimeout(() => {
            card.style.display = "none";
            card.classList.remove("hiding");
          }, 300);
        }
      });
    });
  }
}
