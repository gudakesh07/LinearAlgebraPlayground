import type { Dim, Vec3 } from "./types";

export const EPS = 1e-9;

export function vec(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function cloneVec(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function vecForDim(v: Vec3, dim: Dim): Vec3 {
  return dim === 2 ? { x: v.x, y: v.y, z: 0 } : { ...v };
}

export function mag(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(v: Vec3, k: number): Vec3 {
  return { x: v.x * k, y: v.y * k, z: v.z * k };
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalize(v: Vec3): Vec3 | null {
  const m = mag(v);
  if (m < EPS) return null;
  return scale(v, 1 / m);
}

export function project(a: Vec3, onto: Vec3): Vec3 {
  const d = dot(onto, onto);
  if (d < EPS) return vec();
  return scale(onto, dot(a, onto) / d);
}

export function angleBetween(a: Vec3, b: Vec3): number | null {
  const ma = mag(a);
  const mb = mag(b);
  if (ma < EPS || mb < EPS) return null;
  const c = Math.min(1, Math.max(-1, dot(a, b) / (ma * mb)));
  return Math.acos(c);
}

export function nearly(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

export function isZero(v: Vec3, eps = 1e-8): boolean {
  return mag(v) < eps;
}

export function isParallel(a: Vec3, b: Vec3): boolean {
  if (isZero(a) || isZero(b)) return true;
  return mag(cross(a, b)) < 1e-6 * mag(a) * mag(b);
}

export function identity(n: Dim = 3): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

export function cloneMat(m: number[][]): number[][] {
  return m.map((row) => [...row]);
}

export function ensureMat3(m: number[][]): number[][] {
  const out = identity(3);
  for (let i = 0; i < Math.min(3, m.length); i++) {
    for (let j = 0; j < Math.min(3, m[i]?.length ?? 0); j++) {
      const v = m[i][j];
      out[i][j] = Number.isFinite(v) ? v : out[i][j];
    }
  }
  return out;
}

export function takeMat(m: number[][], dim: Dim): number[][] {
  const src = ensureMat3(m);
  return src.slice(0, dim).map((row) => row.slice(0, dim));
}

export function setMatCell(
  m: number[][],
  i: number,
  j: number,
  value: number,
): number[][] {
  const out = ensureMat3(m);
  out[i] = [...out[i]];
  out[i][j] = value;
  return out;
}

export function mulMatVec(m: number[][], v: Vec3): Vec3 {
  const n = m.length;
  if (n === 2) {
    return {
      x: m[0][0] * v.x + m[0][1] * v.y,
      y: m[1][0] * v.x + m[1][1] * v.y,
      z: 0,
    };
  }
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
  };
}

export function mulMat(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const out = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += a[i][k] * b[k][j];
      out[i][j] = s;
    }
  }
  return out;
}

export function det(m: number[][]): number {
  if (m.length === 2) {
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  }
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

export function fmt(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  const v = Math.abs(n) < 1e-12 ? 0 : n;
  return Number.parseFloat(v.toFixed(digits)).toString();
}

export function formatVec(v: Vec3, dim: Dim): string {
  const parts = dim === 2 ? [v.x, v.y] : [v.x, v.y, v.z];
  return `(${parts.map((p) => fmt(p)).join(", ")})`;
}

export function formatMat(m: number[][]): string {
  return m.map((row) => `[${row.map((n) => fmt(n)).join(", ")}]`).join(" ");
}

export function formatMatLines(m: number[][]): string {
  return m.map((row) => `[ ${row.map((n) => fmt(n).padStart(6, " ")).join("  ")} ]`).join("\n");
}

export function parseScalar(raw: string): number | null {
  const t = raw.trim();
  if (t === "" || t === "-" || t === "+" || t === "." || t === "-." || t === "+.") {
    return null;
  }
  if (t.endsWith(".") || /[eE]$/.test(t) || /[eE][+-]$/.test(t)) return null;
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
