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
  const raw = 56 / scale;
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

function firstTick(min: number, step: number): number {
  return Math.ceil((min + 1e-12) / step) * step;
}

function formatTick(t: number): string {
  return String(Number.parseFloat(t.toPrecision(4)));
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

function drawAxisHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
) {
  const head = 8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - head * Math.cos(angle - 0.38),
    y - head * Math.sin(angle - 0.38),
  );
  ctx.lineTo(
    x - head * Math.cos(angle + 0.38),
    y - head * Math.sin(angle + 0.38),
  );
  ctx.closePath();
  ctx.fill();
}

function fillLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline,
  color: string,
) {
  ctx.save();
  ctx.font = "11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  const width = ctx.measureText(text).width;
  const height = 12;
  let bx = x;
  let by = y;
  if (align === "center") bx = x - width / 2;
  else if (align === "right") bx = x - width;
  if (baseline === "middle") by = y - height / 2;
  else if (baseline === "top") by = y;
  else if (baseline === "bottom") by = y - height;
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(bx - 3, by - 1, width + 6, height + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function extentOf(model: SceneModel): number {
  let max = 0;
  const consider = (v: Vec3) => {
    max = Math.max(max, Math.abs(v.x), Math.abs(v.y));
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
  return Math.max(3, max * 1.35 + 0.75);
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, model: SceneModel) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const pad = { l: 44, r: 40, t: 32, b: 40 };
  const plotW = Math.max(40, w - pad.l - pad.r);
  const plotH = Math.max(40, h - pad.t - pad.b);
  const ox = pad.l + plotW / 2;
  const oy = pad.t + plotH / 2;

  const world = extentOf(model);
  const scale = Math.min(plotW / 2, plotH / 2) / world;
  const step = tickStep(scale, world);
  const xMin = -(plotW / 2) / scale;
  const xMax = plotW / 2 / scale;
  const yMin = -(plotH / 2) / scale;
  const yMax = plotH / 2 / scale;

  const toS = (v: Vec3) => worldToScreen(v, ox, oy, scale);

  ctx.save();
  ctx.beginPath();
  ctx.rect(pad.l, pad.t, plotW, plotH);
  ctx.clip();

  ctx.lineCap = "butt";
  for (let x = firstTick(xMin, step); x <= xMax + 1e-9; x += step) {
    const px = toS({ x, y: 0, z: 0 }).x;
    const isAxis = Math.abs(x) < 1e-9;
    ctx.beginPath();
    ctx.strokeStyle = isAxis ? "#3a3a3a" : "#141414";
    ctx.lineWidth = isAxis ? 1.25 : 1;
    ctx.moveTo(px, pad.t);
    ctx.lineTo(px, pad.t + plotH);
    ctx.stroke();
  }
  for (let y = firstTick(yMin, step); y <= yMax + 1e-9; y += step) {
    const py = toS({ x: 0, y, z: 0 }).y;
    const isAxis = Math.abs(y) < 1e-9;
    ctx.beginPath();
    ctx.strokeStyle = isAxis ? "#3a3a3a" : "#141414";
    ctx.lineWidth = isAxis ? 1.25 : 1;
    ctx.moveTo(pad.l, py);
    ctx.lineTo(pad.l + plotW, py);
    ctx.stroke();
  }

  if (model.gridMatrix) {
    const M = model.gridMatrix;
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#3a2a2a";
    ctx.lineWidth = 1;
    const reach = Math.max(Math.abs(xMin), Math.abs(xMax), Math.abs(yMin), Math.abs(yMax)) * 1.2;
    for (let t = firstTick(-reach, step); t <= reach + 1e-9; t += step) {
      const a = toS(mulMatVec(M, { x: -reach, y: t, z: 0 }));
      const b = toS(mulMatVec(M, { x: reach, y: t, z: 0 }));
      const c = toS(mulMatVec(M, { x: t, y: -reach, z: 0 }));
      const d = toS(mulMatVec(M, { x: t, y: reach, z: 0 }));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  ctx.strokeStyle = "#4a4a4a";
  ctx.fillStyle = "#4a4a4a";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(pad.l, oy);
  ctx.lineTo(pad.l + plotW - 1, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, pad.t + plotH);
  ctx.lineTo(ox, pad.t + 1);
  ctx.stroke();
  drawAxisHead(ctx, pad.l + plotW, oy, 0);
  drawAxisHead(ctx, ox, pad.t, -Math.PI / 2);

  const tickLen = 5;
  for (let x = firstTick(xMin, step); x <= xMax + 1e-9; x += step) {
    if (Math.abs(x) < 1e-9) continue;
    const p = toS({ x, y: 0, z: 0 });
    if (p.x < pad.l + 10 || p.x > pad.l + plotW - 18) continue;
    ctx.beginPath();
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.moveTo(p.x, oy - tickLen);
    ctx.lineTo(p.x, oy + tickLen);
    ctx.stroke();
    fillLabel(ctx, formatTick(x), p.x, oy + tickLen + 6, "center", "top", "#8a8a8a");
  }
  for (let y = firstTick(yMin, step); y <= yMax + 1e-9; y += step) {
    if (Math.abs(y) < 1e-9) continue;
    const p = toS({ x: 0, y, z: 0 });
    if (p.y < pad.t + 16 || p.y > pad.t + plotH - 16) continue;
    ctx.beginPath();
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.moveTo(ox - tickLen, p.y);
    ctx.lineTo(ox + tickLen, p.y);
    ctx.stroke();
    fillLabel(ctx, formatTick(y), ox - tickLen - 6, p.y, "right", "middle", "#8a8a8a");
  }

  fillLabel(ctx, "0", ox - 8, oy + 8, "right", "top", "#8a8a8a");
  fillLabel(ctx, "x", pad.l + plotW - 4, oy - 10, "right", "bottom", "#9a9a9a");
  fillLabel(ctx, "y", ox + 10, pad.t + 4, "left", "top", "#9a9a9a");

  ctx.beginPath();
  ctx.fillStyle = "#c8c8c8";
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
    const lx = q.x + (q.x >= ox ? 10 : -10);
    const ly = q.y + (q.y <= oy ? -8 : 8);
    fillLabel(
      ctx,
      a.label,
      lx,
      ly,
      q.x >= ox ? "left" : "right",
      q.y <= oy ? "bottom" : "top",
      COLOR_MAP[a.color],
    );
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
