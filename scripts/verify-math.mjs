import { createRequire } from "node:module";

// Lightweight sanity checks for the math used by the playground.
function nearly(a, b, eps = 1e-9) {
  return Math.abs(a - b) < eps;
}
function fail(msg) {
  console.error("FAIL:", msg);
  process.exitCode = 1;
}

const a = { x: 2, y: 1, z: 0 };
const b = { x: 1, y: 2, z: 1 };
const sum = { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
if (!nearly(sum.x, 3) || !nearly(sum.y, 3) || !nearly(sum.z, 1)) fail("add");

const d = a.x * b.x + a.y * b.y + a.z * b.z;
if (!nearly(d, 4)) fail("dot 2+2+0");

const c = {
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
};
if (!nearly(c.x, 1) || !nearly(c.y, -2) || !nearly(c.z, 3)) fail("cross");

const M = [
  [1, 1],
  [0, 1],
];
const Mv = { x: M[0][0] * a.x + M[0][1] * a.y, y: M[1][0] * a.x + M[1][1] * a.y };
if (!nearly(Mv.x, 3) || !nearly(Mv.y, 1)) fail("shear * (2,1)");

const det2 = M[0][0] * M[1][1] - M[0][1] * M[1][0];
if (!nearly(det2, 1)) fail("det shear = 1");

const N = [
  [0, -1],
  [1, 0],
];
const P = [
  [M[0][0] * N[0][0] + M[0][1] * N[1][0], M[0][0] * N[0][1] + M[0][1] * N[1][1]],
  [M[1][0] * N[0][0] + M[1][1] * N[1][0], M[1][0] * N[0][1] + M[1][1] * N[1][1]],
];
if (!nearly(P[0][0], 1) || !nearly(P[0][1], -1) || !nearly(P[1][0], 1) || !nearly(P[1][1], 0)) {
  fail(`MN expected [[1,-1],[1,0]] got ${JSON.stringify(P)}`);
}

if (!process.exitCode) console.log("math ok");
