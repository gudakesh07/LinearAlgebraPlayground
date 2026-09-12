import {
  add,
  angleBetween,
  cross,
  det,
  dot,
  formatMat,
  formatVec,
  fmt,
  isParallel,
  isZero,
  lerp,
  mag,
  mulMat,
  mulMatVec,
  nearly,
  normalize,
  project,
  scale,
  sub,
  takeMat,
  vec,
  vecForDim,
} from "./math";
import type {
  ArrowSpec,
  PlaygroundState,
  PolygonSpec,
  SceneModel,
  SegmentSpec,
  Vec3,
} from "./types";

function arrow(
  id: string,
  label: string,
  v: Vec3,
  color: ArrowSpec["color"],
  extra?: Partial<ArrowSpec>,
): ArrowSpec {
  return { id, label, vec: v, color, ...extra };
}

function interpretDet(d: number, dim: PlaygroundState["dim"]): string {
  if (nearly(d, 0)) {
    return dim === 2
      ? "Determinant = 0 — this transformation squishes space onto a line (or a point)."
      : "Determinant = 0 — this transformation squishes space onto a plane, a line, or a point.";
  }
  const abs = Math.abs(d);
  const noun = dim === 2 ? "areas" : "volumes";
  let scaleNote: string;
  if (nearly(abs, 1)) {
    scaleNote = `${noun} are preserved`;
  } else if (abs > 1) {
    scaleNote = `space expands; ${noun} scale by ${fmt(abs)}`;
  } else {
    scaleNote = `space compresses; ${noun} scale by ${fmt(abs)}`;
  }
  if (d < 0) {
    return `Determinant = ${fmt(d)} — orientation is flipped, and ${scaleNote}.`;
  }
  return `Determinant = ${fmt(d)} — ${scaleNote}.`;
}

function rightAngleMark(at: Vec3, u: Vec3, v: Vec3, size: number): PolygonSpec | null {
  const nu = normalize(u);
  const nv = normalize(v);
  if (!nu || !nv) return null;
  const s = Math.min(size, mag(u) * 0.25, mag(v) * 0.25);
  if (s < 1e-6) return null;
  const su = scale(nu, s);
  const sv = scale(nv, s);
  return {
    id: "right-angle",
    color: "dim",
    points: [at, add(at, su), add(at, add(su, sv)), add(at, sv)],
  };
}

export function buildScene(state: PlaygroundState): SceneModel {
  const dim = state.dim;
  const a = vecForDim(state.a, dim);
  const b = vecForDim(state.b, dim);
  const arrows: ArrowSpec[] = [];
  const segments: SegmentSpec[] = [];
  const polygons: PolygonSpec[] = [];
  let gridMatrix: number[][] | null = null;
  let resultText = "";
  let interpretation = "";

  switch (state.op) {
    case "visualize": {
      arrows.push(arrow("a", "A", a, "a"), arrow("b", "B", b, "b"));
      resultText = `A = ${formatVec(a, dim)}  B = ${formatVec(b, dim)}`;
      if (isZero(a) && isZero(b)) {
        interpretation = "Both vectors sit at the origin — they have no direction yet.";
      } else if (isParallel(a, b) && !isZero(a) && !isZero(b)) {
        interpretation = "A and B lie on the same line through the origin.";
      } else {
        interpretation =
          "Two vectors from the origin. Change a component and watch the arrow move.";
      }
      break;
    }
    case "add": {
      const sum = add(a, b);
      arrows.push(
        arrow("a", "A", a, "a"),
        arrow("b", "B", b, "b"),
        arrow("b-tail", "B", b, "b", { from: a, dashed: true }),
        arrow("sum", "A+B", sum, "result"),
      );
      polygons.push({
        id: "para",
        color: "result",
        points: [vec(), a, sum, b],
      });
      resultText = `A + B = ${formatVec(sum, dim)}`;
      if (isZero(a) && isZero(b)) {
        interpretation = "Zero plus zero is still the origin.";
      } else if (isZero(sum)) {
        interpretation = "A + B = 0 — these vectors cancel; they are opposites.";
      } else if (nearly(mag(sum), mag(a) + mag(b))) {
        interpretation = "They point the same way — the sum is as long as it can be.";
      } else {
        interpretation =
          "The parallelogram rule: the diagonal from the origin is the sum.";
      }
      break;
    }
    case "subtract": {
      const diff = sub(a, b);
      arrows.push(
        arrow("a", "A", a, "a"),
        arrow("b", "B", b, "b"),
        arrow("diff", "A−B", diff, "result"),
      );
      segments.push({
        id: "b-to-a",
        from: b,
        to: a,
        color: "result",
        dashed: true,
      });
      resultText = `A − B = ${formatVec(diff, dim)}`;
      if (isZero(diff)) {
        interpretation = "A − B = 0 — the two vectors are the same.";
      } else {
        interpretation =
          "The dashed arrow from the tip of B to the tip of A is A − B, translated to the origin in amber.";
      }
      break;
    }
    case "scalar": {
      const k = state.scalar;
      const scaled = scale(a, k);
      arrows.push(
        arrow("a", "A", a, "dim"),
        arrow("ka", `${fmt(k)}A`, scaled, "result"),
      );
      resultText = `${fmt(k)} · A = ${formatVec(scaled, dim)}`;
      if (isZero(a)) {
        interpretation = "The zero vector stays at the origin no matter the scalar.";
      } else if (nearly(k, 0)) {
        interpretation = "Scalar = 0 — the vector collapses to the origin.";
      } else if (nearly(k, 1)) {
        interpretation = "Scalar = 1 — the vector is unchanged.";
      } else if (nearly(k, -1)) {
        interpretation = "Scalar = -1 — vector flipped direction.";
      } else if (k < 0 && Math.abs(k) > 1) {
        interpretation = `Scalar = ${fmt(k)} — flipped and stretched ${fmt(Math.abs(k))}×.`;
      } else if (k < 0) {
        interpretation = `Scalar = ${fmt(k)} — flipped and shortened, same line.`;
      } else if (k > 1) {
        interpretation = `Scalar = ${fmt(k)} — stretched to ${fmt(k)}× its original length.`;
      } else {
        interpretation = `Scalar = ${fmt(k)} — shortened, same direction.`;
      }
      break;
    }
    case "dot": {
      const d = dot(a, b);
      const proj = project(a, b);
      arrows.push(arrow("a", "A", a, "a"), arrow("b", "B", b, "b"));
      if (!isZero(b)) {
        arrows.push(arrow("proj", "proj_B A", proj, "result", { dashed: true }));
        segments.push({
          id: "drop",
          from: a,
          to: proj,
          color: "dim",
          dashed: true,
        });
        const residual = sub(a, proj);
        const mark = rightAngleMark(proj, scale(b, Math.sign(dot(proj, b) || 1)), residual, 0.28);
        if (mark) polygons.push(mark);
      }
      resultText = `A · B = ${fmt(d)}`;
      const ma = mag(a);
      const mb = mag(b);
      const ang = angleBetween(a, b);
      const angNote =
        ang === null ? "" : ` The angle between them is ${fmt((ang * 180) / Math.PI, 1)}°.`;
      if (isZero(a) || isZero(b)) {
        interpretation =
          "A zero vector makes the dot product 0 — there is no direction to compare.";
      } else if (nearly(d, 0)) {
        interpretation = `Dot product = 0 — these vectors are perpendicular.${angNote}`;
      } else if (nearly(d, ma * mb)) {
        interpretation = `Dot product = ${fmt(d)} — the vectors point in the same direction.${angNote}`;
      } else if (nearly(d, -ma * mb)) {
        interpretation = `Dot product = ${fmt(d)} — the vectors point in opposite directions.${angNote}`;
      } else if (d > 0) {
        interpretation = `Dot product = ${fmt(d)} — the angle is acute; they share some direction.${angNote}`;
      } else {
        interpretation = `Dot product = ${fmt(d)} — the angle is obtuse; they mostly point apart.${angNote}`;
      }
      break;
    }
    case "cross": {
      const c = cross(a, b);
      arrows.push(
        arrow("a", "A", a, "a"),
        arrow("b", "B", b, "b"),
        arrow("axb", "A×B", c, "result"),
      );
      polygons.push({
        id: "para",
        color: "b",
        points: [vec(), a, add(a, b), b],
      });
      resultText = `A × B = ${formatVec(c, 3)}`;
      const area = mag(c);
      if (isZero(a) || isZero(b)) {
        interpretation = "A zero vector makes the cross product 0 — there is no parallelogram.";
      } else if (isParallel(a, b)) {
        interpretation =
          "A × B = 0 — these vectors are parallel, so the parallelogram they span has no area.";
      } else {
        interpretation = `Length of A × B is ${fmt(area)} — the area of the parallelogram they span. The vector is perpendicular to both.`;
      }
      break;
    }
    case "span": {
      const sA = scale(a, state.s);
      const tB = scale(b, state.t);
      const combo = add(sA, tB);
      arrows.push(
        arrow("a", "A", a, "a"),
        arrow("b", "B", b, "b"),
        arrow("sa", `${fmt(state.s)}A`, sA, "dim", { dashed: true }),
        arrow("tb", `${fmt(state.t)}B`, tB, "dim", { dashed: true }),
        arrow("combo", "sA+tB", combo, "result"),
      );
      if (!isParallel(a, b) && !isZero(a) && !isZero(b)) {
        polygons.push({
          id: "span-para",
          color: "result",
          points: [vec(), sA, combo, tB],
        });
      }
      resultText = `${fmt(state.s)}·A + ${fmt(state.t)}·B = ${formatVec(combo, dim)}`;
      if (isZero(a) && isZero(b)) {
        interpretation = "Both generators are zero — the span is just the origin.";
      } else if (isZero(a) || isZero(b)) {
        interpretation =
          "One generator is zero — the span is the line through the other vector.";
      } else if (isParallel(a, b)) {
        interpretation =
          "A and B are parallel — they span a line, not a plane. Every combination stays on that line.";
      } else if (dim === 2) {
        interpretation =
          "A and B are independent — they span the whole plane. Every 2D vector is some sA + tB.";
      } else {
        interpretation =
          "A and B are independent — they span a plane through the origin in 3D.";
      }
      break;
    }
    case "matrix-vector": {
      const M = takeMat(state.matrixM, dim);
      const transformed = mulMatVec(M, a);
      const displayed = lerp(a, transformed, state.animT);
      gridMatrix = M;
      arrows.push(
        arrow("a", "A", a, "dim"),
        arrow("ma", "MA", displayed, "b"),
      );
      const iHat = mulMatVec(M, vec(1, 0, 0));
      const jHat = mulMatVec(M, vec(0, 1, 0));
      arrows.push(
        arrow("i", "î", iHat, "result", { dashed: true }),
        arrow("j", "ĵ", jHat, "result", { dashed: true }),
      );
      if (dim === 3) {
        arrows.push(
          arrow("k", "k̂", mulMatVec(M, vec(0, 0, 1)), "result", { dashed: true }),
        );
      }
      const d = det(M);
      resultText = `M A = ${formatVec(transformed, dim)}`;
      interpretation = interpretDet(d, dim);
      if (isZero(a)) {
        interpretation = "The zero vector stays put — every linear map sends origin to origin.";
      } else if (isZero(transformed) && !isZero(a)) {
        interpretation =
          "MA = 0 with A ≠ 0 — A lives in the null space; the matrix flattens this direction away.";
      }
      break;
    }
    case "matrix-matrix": {
      const M = takeMat(state.matrixM, dim);
      const N = takeMat(state.matrixN, dim);
      const P = mulMat(M, N);
      const nA = mulMatVec(N, a);
      const pA = mulMatVec(P, a);
      gridMatrix = P;
      arrows.push(
        arrow("a", "A", a, "dim"),
        arrow("na", "NA", nA, "b", { dashed: true }),
        arrow("mna", "MNA", pA, "result"),
      );
      resultText = `M N = ${formatMat(P)}  (M N) A = ${formatVec(pA, dim)}`;
      const dM = det(M);
      const dN = det(N);
      const dP = det(P);
      if (nearly(dP, 0)) {
        interpretation =
          "The product has determinant 0 — the composed map squishes space. N is applied first, then M.";
      } else if (nearly(dN, 0) || nearly(dM, 0)) {
        interpretation =
          "One factor already collapses space, so the product does too. N is applied first, then M.";
      } else {
        interpretation = `N first, then M. det(MN) = ${fmt(dP)} = det(M)·det(N) = ${fmt(dM)}·${fmt(dN)}.`;
      }
      break;
    }
  }

  return { arrows, segments, polygons, gridMatrix, resultText, interpretation };
}
