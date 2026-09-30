interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  isForge: boolean;
  hue: number;
  sat: number;
  light: number;
  alpha: number;
  baseAlpha: number;
  pulse: number;
}

export class ParticleField {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private readonly mouse = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    if (ctx === null) throw new Error("2D canvas context is unavailable");

    this.canvas = canvas;
    this.ctx = ctx;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.init();
  }

  private init(): void {
    this.particles = [];
    const area = this.canvas.width * this.canvas.height;
    const count = Math.min(Math.floor(area / 10000), 200);
    const midX = this.canvas.width / 2;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.canvas.width;
      const isForge = x < midX;

      this.particles.push({
        x,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: isForge ? -(Math.random() * 0.6 + 0.1) : (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.5,
        isForge,
        hue: isForge ? 20 + Math.random() * 25 : 260 + Math.random() * 30,
        sat: isForge ? 85 + Math.random() * 15 : 65 + Math.random() * 20,
        light: isForge ? 50 + Math.random() * 20 : 55 + Math.random() * 20,
        alpha: 0.15 + Math.random() * 0.4,
        baseAlpha: 0.15 + Math.random() * 0.4,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  private update(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const midX = w / 2;

    for (const p of this.particles) {
      p.pulse += 0.02;
      p.alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.pulse));

      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.isForge) {
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * midX;
        }

        if (p.x < -10) p.x = midX;

        if (p.x > midX + 10) p.x = 0;
      } else {
        if (p.y < -10) p.y = h + 10;

        if (p.y > h + 10) p.y = -10;

        if (p.x < midX - 10) p.x = w;

        if (p.x > w + 10) p.x = midX;
      }
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const midX = this.canvas.width / 2;

    // Draw connections for circuit side (right)
    const circuitParticles = this.particles.filter((p) => !p.isForge);

    for (let i = 0; i < circuitParticles.length; i++) {
      const a = circuitParticles[i];

      if (a === undefined) continue;

      for (let j = i + 1; j < circuitParticles.length; j++) {
        const b = circuitParticles[j];

        if (b === undefined) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          const opacity = (1 - dist / 120) * 0.12;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${p.alpha})`;
      this.ctx.fill();

      // Glow effect for forge particles
      if (p.isForge && p.size > 1.5) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${p.alpha * 0.15})`;
        this.ctx.fill();
      }
    }

    // Subtle center divider
    const grad = this.ctx.createLinearGradient(midX, 0, midX, this.canvas.height);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.3, "rgba(255,255,255,0.03)");
    grad.addColorStop(0.7, "rgba(255,255,255,0.03)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(midX - 0.5, 0, 1, this.canvas.height);
  }

  animate(): void {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
