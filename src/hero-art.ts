const GRID = 28;

const TAU = Math.PI * 2;

const PULSE_SAMPLES = 9;

const PULSE_SPACING = 5;

const EMBER_TONES: readonly string[] = ["249, 115, 22", "251, 146, 60", "251, 191, 36"];

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Segment {
  readonly from: Point;
  readonly to: Point;
  readonly start: number;
  readonly end: number;
}

interface Trace {
  readonly segments: readonly Segment[];
  readonly nodes: readonly Point[];
  readonly length: number;
}

interface Pulse {
  trace: Trace;
  distance: number;
  speed: number;
  cyan: boolean;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  tone: number;
  alpha: number;
  phase: number;
  sway: number;
}

function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A horizontal band a trace must stay out of, so the artwork never runs behind the text. */
interface Band {
  readonly top: number;
  readonly bottom: number;
}

/** A PCB-style route: long runs west with 45 degree jogs and vertical hops, all on the grid. */
function buildTrace(
  rand: () => number,
  startX: number,
  startY: number,
  minX: number,
  height: number,
  keepOut: Band | null,
): Trace | null {
  const segments: Segment[] = [];
  const nodes: Point[] = [{ x: startX, y: startY }];
  let x = startX;
  let y = startY;
  let length = 0;
  let straight = true;
  const steps = 4 + Math.floor(rand() * 4);

  for (let i = 0; i < steps; i++) {
    let dx = -1;
    let dy = 0;
    let cells = 2 + Math.floor(rand() * 5);

    if (!straight) {
      const sign = rand() < 0.5 ? -1 : 1;

      if (rand() < 0.6) {
        dy = sign;
        cells = 1 + Math.floor(rand() * 3);
      } else {
        dx = 0;
        dy = sign;
        cells = 2 + Math.floor(rand() * 4);
      }
    }

    const nextX = x + dx * cells * GRID;
    const nextY = y + dy * cells * GRID;

    if (nextX < minX || nextY < GRID || nextY > height - GRID) break;

    if (keepOut !== null && Math.min(y, nextY) < keepOut.bottom && Math.max(y, nextY) > keepOut.top) break;

    const span = Math.hypot(nextX - x, nextY - y);
    segments.push({ from: { x, y }, to: { x: nextX, y: nextY }, start: length, end: length + span });
    length += span;
    x = nextX;
    y = nextY;
    nodes.push({ x, y });
    straight = !straight;
  }

  return segments.length >= 2 ? { segments, nodes, length } : null;
}

function pointAt(trace: Trace, distance: number): Point | null {
  if (distance < 0 || distance > trace.length) return null;

  for (const segment of trace.segments) {
    if (distance <= segment.end) {
      const t = (distance - segment.start) / (segment.end - segment.start);

      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * t,
        y: segment.from.y + (segment.to.y - segment.from.y) * t,
      };
    }
  }

  return null;
}

/** A soft glowing orb with a hot core, rendered once per tone so each ember is a single drawImage. */
function makeEmberSprite(rgb: string): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement("canvas");

  sprite.width = size;
  sprite.height = size;

  const c = sprite.getContext("2d");

  if (c === null) throw new Error("2D canvas context is unavailable");

  const glow = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  glow.addColorStop(0, "rgba(255, 246, 222, 1)");
  glow.addColorStop(0.1, `rgba(${rgb}, 0.95)`);
  glow.addColorStop(0.38, `rgba(${rgb}, 0.4)`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  c.fillStyle = glow;
  c.fillRect(0, 0, size, size);

  return sprite;
}

/**
 * The hero artwork: embers rising on the forge (left) half, circuit traces with travelling
 * signal pulses on the circuit (right) half. Static pieces are painted once into an offscreen
 * layer; only embers and pulses move. It stops when off screen, when the tab is hidden, and
 * draws a single still frame under prefers-reduced-motion.
 */
export class HeroArt {
  private readonly canvas: HTMLCanvasElement;
  private readonly host: HTMLElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly layer = document.createElement("canvas");
  private readonly layerCtx: CanvasRenderingContext2D;
  private readonly sprites = EMBER_TONES.map(makeEmberSprite);
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private width = 0;
  private height = 0;
  private seamX = 0;
  private dpr = 1;
  private embers: Ember[] = [];
  private traces: Trace[] = [];
  private pulses: Pulse[] = [];
  private running = false;
  private onScreen = true;
  private last = 0;
  private frame = 0;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement) {
    const ctx = canvas.getContext("2d");
    const layerCtx = this.layer.getContext("2d");

    if (ctx === null || layerCtx === null) throw new Error("2D canvas context is unavailable");

    this.canvas = canvas;
    this.host = host;
    this.ctx = ctx;
    this.layerCtx = layerCtx;

    new ResizeObserver(() => this.resize()).observe(host);
    new IntersectionObserver(([entry]) => {
      this.onScreen = entry?.isIntersecting ?? true;
      this.sync();
    }).observe(host);
    this.reducedMotion.addEventListener("change", () => this.sync());
    document.addEventListener("visibilitychange", () => this.sync());
    this.resize();
  }

  private resize(): void {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (width === this.width && height === this.height && dpr === this.dpr) return;

    this.width = width;
    this.height = height;
    this.dpr = dpr;

    for (const surface of [this.canvas, this.layer]) {
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
    }

    this.seamX = Math.round(width / 2 / GRID) * GRID;
    this.build();
    this.paintLayer();
    this.sync();
  }

  private build(): void {
    const rand = seededRandom(0x5eed);
    const right = Math.floor(this.width / GRID) * GRID;
    const rows = Math.floor(this.height / GRID);
    const wanted = Math.max(7, Math.min(16, Math.round((this.width * this.height) / 85000)));
    const wide = this.width >= 900;
    const reach = wide ? Math.round((this.width * 0.2) / GRID) * GRID : 0;
    const keepOut = wide ? null : { top: this.height * 0.24, bottom: this.height * 0.76 };

    this.traces = [];

    for (let i = 0; i < wanted * 3 && this.traces.length < wanted; i++) {
      const startX = right - GRID * Math.floor(rand() * 3);
      const startY = (1 + Math.floor(rand() * (rows - 1))) * GRID;
      const trace = buildTrace(rand, startX, startY, this.seamX + reach, this.height, keepOut);

      if (trace !== null) this.traces.push(trace);
    }

    this.pulses = [];

    for (const trace of this.traces) {
      if (rand() < 0.75) {
        this.pulses.push({ trace, distance: rand() * trace.length, speed: 55 + rand() * 70, cyan: rand() < 0.45 });
      }
    }

    this.embers = [];

    const count = Math.min(170, Math.round((this.seamX * this.height) / 6500));

    for (let i = 0; i < count; i++) this.embers.push(this.spawnEmber(true));
  }

  private spawnEmber(initial: boolean): Ember {
    const deep = Math.random() < 0.07;

    return {
      x: this.seamX * Math.random() ** 1.3,
      y: initial ? this.height * (1 - Math.random() ** 1.8) : this.height + 16,
      vx: (Math.random() - 0.5) * 0.18,
      vy: deep ? -(0.12 + Math.random() * 0.2) : -(0.28 + Math.random() * 0.8),
      size: deep ? 3.4 + Math.random() * 2.4 : 0.7 + Math.random() ** 2.2 * 2.3,
      tone: Math.floor(Math.random() * EMBER_TONES.length),
      alpha: deep ? 0.12 + Math.random() * 0.1 : 0.4 + Math.random() * 0.6,
      phase: Math.random() * TAU,
      sway: 0.6 + Math.random() * 1.4,
    };
  }

  /** Compass arcs, polar rays and tick marks around the heat source: the hand-drafted counterpart to the traces. */
  private paintDrafting(c: CanvasRenderingContext2D): void {
    const originY = this.height;

    c.save();
    c.beginPath();
    c.rect(0, 0, this.seamX, this.height);
    c.clip();
    c.lineWidth = 1;

    for (const [i, radius] of [150, 280, 410, 540, 670].entries()) {
      c.strokeStyle = "rgba(251, 146, 60, 0.26)";
      c.setLineDash(i % 2 === 0 ? [] : [3, 7]);
      c.beginPath();
      c.arc(0, originY, radius, -Math.PI / 2, 0);
      c.stroke();
    }

    c.setLineDash([]);
    c.strokeStyle = "rgba(251, 146, 60, 0.14)";

    for (let deg = 15; deg < 90; deg += 15) {
      const angle = (-deg * Math.PI) / 180;

      c.beginPath();
      c.moveTo(0, originY);
      c.lineTo(Math.cos(angle) * 670, originY + Math.sin(angle) * 670);
      c.stroke();
    }

    c.strokeStyle = "rgba(251, 191, 36, 0.4)";

    for (const radius of [410, 540, 670]) {
      for (let deg = 0; deg <= 90; deg += 7.5) {
        const angle = (-deg * Math.PI) / 180;
        const tick = deg % 15 === 0 ? 9 : 5;

        c.beginPath();
        c.moveTo(Math.cos(angle) * radius, originY + Math.sin(angle) * radius);
        c.lineTo(Math.cos(angle) * (radius - tick), originY + Math.sin(angle) * (radius - tick));
        c.stroke();
      }
    }

    c.restore();
  }

  /** Everything that does not move: circuit plotted points, traces and their nodes. */
  private paintLayer(): void {
    const c = this.layerCtx;

    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    this.paintDrafting(c);

    c.fillStyle = "rgba(167, 139, 250, 0.3)";

    for (let x = this.seamX; x <= this.width; x += GRID) {
      for (let y = GRID; y < this.height; y += GRID) c.fillRect(x - 0.5, y - 0.5, 1.2, 1.2);
    }

    c.lineJoin = "round";
    c.lineCap = "round";
    c.lineWidth = 1.25;

    for (const trace of this.traces) {
      c.strokeStyle = "rgba(139, 92, 246, 0.38)";
      c.beginPath();

      for (const [i, segment] of trace.segments.entries()) {
        if (i === 0) c.moveTo(segment.from.x, segment.from.y);
        c.lineTo(segment.to.x, segment.to.y);
      }

      c.stroke();

      for (const [i, node] of trace.nodes.entries()) {
        const isEnd = i === 0 || i === trace.nodes.length - 1;

        c.beginPath();
        c.arc(node.x, node.y, isEnd ? 3.6 : 1.7, 0, TAU);

        if (isEnd) {
          c.fillStyle = "#0a0b0f";
          c.fill();
          c.strokeStyle = "rgba(167, 139, 250, 0.75)";
          c.stroke();
        } else {
          c.fillStyle = "rgba(167, 139, 250, 0.55)";
          c.fill();
        }
      }
    }
  }

  private sync(): void {
    const animate = this.onScreen && !this.reducedMotion.matches && !document.hidden;

    if (animate && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    } else if (!animate && this.running) {
      this.running = false;
      cancelAnimationFrame(this.frame);
    }

    if (!animate) this.draw();
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;

    const dt = Math.min(Math.max(now - this.last, 0), 48);
    this.last = now;
    this.update(dt);
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  private update(dt: number): void {
    const k = dt / 16.667;

    for (const [i, ember] of this.embers.entries()) {
      ember.phase += 0.045 * k;
      ember.x += (ember.vx + Math.sin(ember.phase * ember.sway) * 0.12) * k;
      ember.y += ember.vy * k;

      if (ember.y < -14 || ember.x < -14 || ember.x > this.seamX + 24) this.embers[i] = this.spawnEmber(false);
    }

    for (const pulse of this.pulses) {
      pulse.distance += (pulse.speed * dt) / 1000;

      if (pulse.distance > pulse.trace.length + PULSE_SAMPLES * PULSE_SPACING) {
        pulse.distance = -Math.random() * 80;
        pulse.speed = 55 + Math.random() * 70;
      }
    }
  }

  private draw(): void {
    const { ctx } = this;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.drawImage(this.layer, 0, 0, this.width, this.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    this.drawEmbers();
    this.drawPulses();
    ctx.globalCompositeOperation = "source-over";
  }

  private drawEmbers(): void {
    const { ctx } = this;

    for (const ember of this.embers) {
      const sprite = this.sprites[ember.tone];

      if (sprite === undefined) continue;

      const rise = 1 - ember.y / this.height;
      const flicker = 0.7 + 0.3 * Math.sin(ember.phase * 2.3);
      const radius = ember.size * 4.4;

      ctx.globalAlpha = Math.max(0, ember.alpha * flicker * (1 - rise * 0.75));
      ctx.drawImage(sprite, ember.x - radius, ember.y - radius, radius * 2, radius * 2);
    }

    ctx.globalAlpha = 1;
  }

  private drawPulses(): void {
    const { ctx } = this;

    for (const pulse of this.pulses) {
      const color = pulse.cyan ? "6, 182, 212" : "167, 139, 250";

      for (let i = 0; i < PULSE_SAMPLES; i++) {
        const point = pointAt(pulse.trace, pulse.distance - i * PULSE_SPACING);

        if (point === null) continue;

        const fade = 1 - i / PULSE_SAMPLES;

        ctx.fillStyle = `rgba(${color}, ${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.4 * fade + 0.4, 0, TAU);
        ctx.fill();

        if (i === 0) {
          ctx.fillStyle = `rgba(${color}, 0.16)`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 9, 0, TAU);
          ctx.fill();
        }
      }
    }
  }
}
