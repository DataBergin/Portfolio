export function initScrollAnimations(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  for (const el of document.querySelectorAll(".project-card, .about-section, .contact-section")) {
    observer.observe(el);
  }
}

export function initCardStagger(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);

      visible.forEach((entry, i) => {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, i * 120);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );

  for (const card of document.querySelectorAll(".project-card")) {
    observer.observe(card);
  }
}
