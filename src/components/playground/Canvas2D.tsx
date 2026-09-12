import { useEffect, useRef } from "react";
import { mag, mulMatVec, vec } from "@/lib/math";
import {
  COLOR_MAP,
  COLORS,
  type SceneModel,
  type Vec3,
} from "@/lib/types";

interface Canvas2DProps {
  model: SceneModel;
}

function tickStep(scale: number, world: number): number {
  const raw = 48 / scale;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-6)));
  const n = raw / pow;
  let step = pow;
  if (n >= 7.5) step = 10 * pow;
  else if (n >= 3.5) step = 5 * pow;
  else if (n >= 1.5) step = 2 * pow;
  if (world >= 3) return Math.max(1, step);
  return step;
}

function worldToScreen(
  v: Vec3,
  ox: number,
  oy: number,
  scale: number,
): { x: number; y: number } {
  return { x: ox + v.x * scale, y: oy - v.y * scale };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  dashed: boolean,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (dashed) ctx.setLineDash([6, 5]);

  if (len < 2) {
    ctx.beginPath();
    ctx.arc(x0, y0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const angle = Math.atan2(dy, dx);
  const head = Math.min(12, len * 0.28);
  const tailX = x1 - Math.cos(angle) * head * 0.72;
  const tailY = y1 - Math.sin(angle) * head * 0.72;

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(tailX, tailY);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - head * Math.cos(angle - 0.4),
    y1 - head * Math.sin(angle - 0.4),
  );
  ctx.lineTo(
    x1 - head * Math.cos(angle + 0.4),
    y1 - head * Math.sin(angle + 0.4),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function extentOf(model: SceneModel): number {
  let max = 4;
  const consider = (v: Vec3) => {
    max = Math.max(max, Math.abs(v.x), Math.abs(v.y), mag(v) * 0.6);
  };
  for (const a of model.arrows) {
    const from = a.from ?? vec();
    consider(from);
    consider({ x: from.x + a.vec.x, y: from.y + a.vec.y, z: 0 });
  }
  for (const s of model.segments) {
    consider(s.from);
    consider(s.to);
  }
  for (const p of model.polygons) {
    for (const pt of p.points) consider(pt);
  }
  return max * 1.4;
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, model: SceneModel) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const ox = w / 2;
  const oy = h / 2;
  const world = extentOf(model);
  const scale = Math.min(w, h) / 2 / world;
  const step = tickStep(scale, world);
  const maxTick = Math.ceil(world / step) * step + step;

  const toS = (v: Vec3) => worldToScreen(v, ox, oy, scale);

  ctx.font = "11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const drawGridLine = (
    a: Vec3,
    b: Vec3,
    color: string,
    width: number,
  ) => {
    const p = toS(a);
    const q = toS(b);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  };

  for (let t = -maxTick; t <= maxTick + 1e-9; t += step) {
    const major = Math.abs(t) < 1e-9;
    drawGridLine(
      { x: t, y: -maxTick, z: 0 },
      { x: t, y: maxTick, z: 0 },
      major ? COLORS.axis : COLORS.grid,
      major ? 1.25 : 1,
    );
    drawGridLine(
      { x: -maxTick, y: t, z: 0 },
      { x: maxTick, y: t, z: 0 },
      major ? COLORS.axis : COLORS.grid,
      major ? 1.25 : 1,
    );
  }

  if (model.gridMatrix) {
    const M = model.gridMatrix;
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let t = -maxTick; t <= maxTick + 1e-9; t += step) {
      const a = mulMatVec(M, { x: -maxTick, y: t, z: 0 });
      const b = mulMatVec(M, { x: maxTick, y: t, z: 0 });
      const c = mulMatVec(M, { x: t, y: -maxTick, z: 0 });
      const d = mulMatVec(M, { x: t, y: maxTick, z: 0 });
      drawGridLine(a, b, "#3a2a2a", 1);
      drawGridLine(c, d, "#3a2a2a", 1);
    }
    ctx.restore();
  }

  ctx.fillStyle = COLORS.dim;
  for (let t = -maxTick; t <= maxTick + 1e-9; t += step) {
    if (Math.abs(t) < 1e-9) continue;
    const onX = toS({ x: t, y: 0, z: 0 });
    const onY = toS({ x: 0, y: t, z: 0 });
    const label = String(Number.parseFloat(t.toPrecision(4)));
    if (onX.y + 12 < h - 8 && onX.x > 18 && onX.x < w - 18) {
      ctx.fillText(label, onX.x, onX.y + 14);
    }
    if (onY.x - 18 > 12 && onY.y > 16 && onY.y < h - 16) {
      ctx.fillText(label, onY.x - 18, onY.y);
    }
  }
  ctx.fillStyle = COLORS.dim;
  ctx.fillText("x", w - 14, oy - 12);
  ctx.fillText("y", ox + 12, 14);

  ctx.beginPath();
  ctx.fillStyle = COLORS.text;
  ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  for (const poly of model.polygons) {
    if (poly.points.length < 3) continue;
    ctx.beginPath();
    poly.points.forEach((pt, i) => {
      const p = toS(pt);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = COLOR_MAP[poly.color];
    ctx.globalAlpha = 0.12;
    ctx.fill();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = COLOR_MAP[poly.color];
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const seg of model.segments) {
    const p = toS(seg.from);
    const q = toS(seg.to);
    ctx.save();
    ctx.strokeStyle = COLOR_MAP[seg.color];
    ctx.lineWidth = 1.5;
    if (seg.dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    ctx.restore();
  }

  for (const a of model.arrows) {
    const from = a.from ?? vec();
    const tip = { x: from.x + a.vec.x, y: from.y + a.vec.y, z: 0 };
    const p = toS(from);
    const q = toS(tip);
    drawArrow(ctx, p.x, p.y, q.x, q.y, COLOR_MAP[a.color], Boolean(a.dashed));
    ctx.fillStyle = COLOR_MAP[a.color];
    ctx.textAlign = q.x >= ox ? "left" : "right";
    ctx.textBaseline = q.y <= oy ? "bottom" : "top";
    ctx.fillText(a.label, q.x + (q.x >= ox ? 8 : -8), q.y + (q.y <= oy ? -6 : 6));
  }
}

export function Canvas2D({ model }: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef(model);
  modelRef.current = model;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w < 2 || h < 2) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, modelRef.current);
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    draw(ctx, w, h, model);
  }, [model]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="2D vector graph"
    />
  );
}
