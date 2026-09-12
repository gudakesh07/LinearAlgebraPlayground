export type Dim = 2 | 3;

export type Operation =
  | "visualize"
  | "add"
  | "subtract"
  | "scalar"
  | "dot"
  | "cross"
  | "span"
  | "matrix-vector"
  | "matrix-matrix";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type VecColor = "a" | "b" | "result" | "dim";

export interface ArrowSpec {
  id: string;
  label: string;
  vec: Vec3;
  from?: Vec3;
  color: VecColor;
  dashed?: boolean;
}

export interface SegmentSpec {
  id: string;
  from: Vec3;
  to: Vec3;
  color: VecColor;
  dashed?: boolean;
}

export interface PolygonSpec {
  id: string;
  points: Vec3[];
  color: VecColor;
}

export interface SceneModel {
  arrows: ArrowSpec[];
  segments: SegmentSpec[];
  polygons: PolygonSpec[];
  /** When set, the 2D canvas draws this linear map applied to the grid. */
  gridMatrix: number[][] | null;
  resultText: string;
  interpretation: string;
}

export interface PlaygroundState {
  dim: Dim;
  a: Vec3;
  b: Vec3;
  op: Operation;
  scalar: number;
  s: number;
  t: number;
  matrixM: number[][];
  matrixN: number[][];
  animT: number;
}

export const COLORS = {
  bg: "#000000",
  panel: "#0a0a0a",
  text: "#f0f0f0",
  dim: "#555555",
  grid: "#1a1a1a",
  gridMajor: "#242424",
  axis: "#2a2a2a",
  border: "#1f1f1f",
  border2: "#2a2a2a",
  pink: "#f9d4d4",
  pinkBorder: "#b18597",
  amber: "#d4b07a",
  vectorA: "#f0f0f0",
  vectorB: "#f9d4d4",
  result: "#d4b07a",
  dimVector: "#8a8a8a",
} as const;

export const COLOR_MAP: Record<VecColor, string> = {
  a: COLORS.vectorA,
  b: COLORS.vectorB,
  result: COLORS.result,
  dim: COLORS.dimVector,
};

export const OPERATIONS: {
  id: Operation;
  label: string;
  fullName: string;
  help: string;
  requires3D?: boolean;
}[] = [
  {
    id: "visualize",
    label: "Visualize",
    fullName: "Visualize",
    help: "Plot the vectors from the origin so you can see where they point in space.",
  },
  {
    id: "add",
    label: "Add",
    fullName: "Vector addition",
    help: "Tip-to-tail: placing B at the tip of A lands you at A + B.",
  },
  {
    id: "subtract",
    label: "Subtract",
    fullName: "Vector subtraction",
    help: "A − B is the vector that takes you from the tip of B to the tip of A.",
  },
  {
    id: "scalar",
    label: "Scalar",
    fullName: "Scalar multiplication",
    help: "A scalar stretches, shrinks, or flips a vector without changing the line it lives on.",
  },
  {
    id: "dot",
    label: "Dot",
    fullName: "Dot product",
    help: "The dot product measures how much two vectors point in the same direction.",
  },
  {
    id: "cross",
    label: "Cross",
    fullName: "Cross product",
    help: "In 3D, the cross product is a vector perpendicular to both inputs — use the right-hand rule.",
    requires3D: true,
  },
  {
    id: "span",
    label: "Span",
    fullName: "Linear combination / span",
    help: "Every pair of numbers (s, t) gives a linear combination sA + tB, which lives in the span of A and B.",
  },
  {
    id: "matrix-vector",
    label: "M×v",
    fullName: "Matrix × vector",
    help: "A matrix eats a vector and spits out another — that is a linear transformation of space.",
  },
  {
    id: "matrix-matrix",
    label: "M×M",
    fullName: "Matrix × matrix",
    help: "Multiplying matrices composes two transformations: apply N first, then M.",
  },
];

export const DEFAULT_A: Vec3 = { x: 2, y: 1, z: 0 };
export const DEFAULT_B: Vec3 = { x: 1, y: 2, z: 1 };

/** Horizontal shear — a classic, readable transformation. */
export const DEFAULT_M: number[][] = [
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** 90° counterclockwise in the xy-plane. */
export const DEFAULT_N: number[][] = [
  [0, -1, 0],
  [1, 0, 0],
  [0, 0, 1],
];
