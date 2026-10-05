import { getById } from "./dom";

interface TerminalLine {
  readonly prompt: boolean;
  readonly text: string;
}

const LINES: readonly TerminalLine[] = [
  { prompt: true, text: "cat about.txt" },
  { prompt: false, text: "" },
  { prompt: false, text: "CS student who ships real products." },
  { prompt: false, text: "From C compression to agent AI systems." },
  { prompt: false, text: "I create the idea and my tools help bring it to life." },
  { prompt: false, text: "" },
  { prompt: true, text: "echo $INTERESTS" },
  { prompt: false, text: "sports analytics, fintech, ML, systems programming" },
];

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function lineHtml(line: TerminalLine, text: string, withCursor: boolean): string {
  const prompt = line.prompt ? '<span class="prompt-char">$ </span>' : "";
  const cursor = withCursor ? '<span class="terminal-cursor"></span>' : "";

  return `<div class="terminal-line">${prompt}${escapeHtml(text)}${cursor}</div>`;
}

export function initTypewriter(): void {
  const body = getById("terminalBody", HTMLElement);

  let lineIdx = 0;
  let charIdx = 0;
  let started = false;

  function render(): void {
    const rendered = LINES.slice(0, lineIdx).map((line) => lineHtml(line, line.text, false));
    const current = LINES[lineIdx];

    if (current !== undefined) {
      rendered.push(lineHtml(current, current.text.substring(0, charIdx), true));
    }

    body.innerHTML = rendered.join("");
  }

  function type(): void {
    const line = LINES[lineIdx];

    if (line === undefined) {
      // Remove cursor at end
      const cursor = body.querySelector(".terminal-cursor");

      if (cursor instanceof HTMLElement) cursor.style.display = "none";

      return;
    }

    if (charIdx <= line.text.length) {
      render();
      charIdx++;
      const delay = line.prompt ? 50 + Math.random() * 30 : 20 + Math.random() * 25;
      setTimeout(type, delay);
    } else {
      lineIdx++;
      charIdx = 0;
      setTimeout(type, line.text === "" ? 100 : 350);
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && !started) {
        started = true;
        setTimeout(type, 400);
        observer.disconnect();
      }
    },
    { threshold: 0.3 },
  );

  observer.observe(body);
}
