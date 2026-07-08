import { useEffect, useRef } from "react";

const COLORS = ["#facc15", "#fde047", "#eab308", "#fbbf24", "#fef08a"];
const COUNT = 140;
const GRAVITY = 0.15;
const DRAG = 0.995;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  spin: number;
}

// Self-contained yellow confetti: rains once from the top, then unhooks itself.
// No dependency, no persistent DOM — a single canvas that clears when particles
// leave the viewport. Skipped entirely under prefers-reduced-motion.
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: rand(0, w),
      y: rand(-h, 0),
      vx: rand(-1.5, 1.5),
      vy: rand(2, 5),
      size: rand(5, 11),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.2, 0.2),
    }));

    let raf = 0;
    let running = true;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of particles) {
        p.vy = (p.vy + GRAVITY) * DRAG;
        p.vx *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (p.y < h + 20) alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (!running || alive === 0) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
