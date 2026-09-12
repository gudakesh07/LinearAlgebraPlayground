import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PopButton } from "@/components/ui/pop-button";
import {
  DEFAULT_A,
  DEFAULT_B,
  DEFAULT_M,
  DEFAULT_N,
  type Dim,
  type Operation,
  type Vec3,
} from "@/lib/types";
import { cloneMat, cloneVec } from "@/lib/math";
import { buildScene } from "@/lib/scene";
import { Canvas2D } from "./Canvas2D";
import { Legend } from "./Legend";
import { MatrixInputs } from "./MatrixInputs";
import { OperationSelector } from "./OperationSelector";
import { OutputPanel } from "./OutputPanel";
import { RotateSlider } from "./RotateSlider";
import { ScalarControls } from "./ScalarControls";
import { VectorInputs } from "./VectorInputs";

const Canvas3D = lazy(() =>
  import("./Canvas3D").then((m) => ({ default: m.Canvas3D })),
);

const DEFAULTS = {
  dim: 2 as Dim,
  a: DEFAULT_A,
  b: DEFAULT_B,
  op: "visualize" as Operation,
  scalar: 1.5,
  s: 1,
  t: 1,
  matrixM: DEFAULT_M,
  matrixN: DEFAULT_N,
};

export function Playground() {
  const [dim, setDim] = useState<Dim>(DEFAULTS.dim);
  const [a, setA] = useState<Vec3>(() => cloneVec(DEFAULTS.a));
  const [b, setB] = useState<Vec3>(() => cloneVec(DEFAULTS.b));
  const [op, setOp] = useState<Operation>(DEFAULTS.op);
  const [scalar, setScalar] = useState(DEFAULTS.scalar);
  const [s, setS] = useState(DEFAULTS.s);
  const [t, setT] = useState(DEFAULTS.t);
  const [matrixM, setMatrixM] = useState(() => cloneMat(DEFAULTS.matrixM));
  const [matrixN, setMatrixN] = useState(() => cloneMat(DEFAULTS.matrixN));
  const [helpOp, setHelpOp] = useState<Operation | null>(null);
  const [azimuth, setAzimuth] = useState(45);
  const [animT, setAnimT] = useState(1);
  const animKey = useRef(0);

  useEffect(() => {
    if (dim === 2 && op === "cross") setOp("visualize");
  }, [dim, op]);

  useEffect(() => {
    if (op !== "matrix-vector") {
      setAnimT(1);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setAnimT(1);
      return;
    }
    const id = ++animKey.current;
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    setAnimT(0);
    const tick = (now: number) => {
      if (id !== animKey.current) return;
      const u = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - u) ** 3;
      setAnimT(eased);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [op, a, matrixM, dim]);

  const model = useMemo(
    () =>
      buildScene({
        dim,
        a,
        b,
        op,
        scalar,
        s,
        t,
        matrixM,
        matrixN,
        animT,
      }),
    [dim, a, b, op, scalar, s, t, matrixM, matrixN, animT],
  );

  function reset() {
    setDim(DEFAULTS.dim);
    setA(cloneVec(DEFAULTS.a));
    setB(cloneVec(DEFAULTS.b));
    setOp(DEFAULTS.op);
    setScalar(DEFAULTS.scalar);
    setS(DEFAULTS.s);
    setT(DEFAULTS.t);
    setMatrixM(cloneMat(DEFAULTS.matrixM));
    setMatrixN(cloneMat(DEFAULTS.matrixN));
    setHelpOp(null);
    setAzimuth(45);
    setAnimT(1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-[#f0f0f0]">
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <h1 className="text-sm font-medium tracking-wide">
          Linear Algebra Playground
        </h1>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-10 px-6 py-8 lg:grid-cols-[minmax(280px,400px)_minmax(0,1fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-10">
          <section className="space-y-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#555]">
              Mode
            </h2>
            <div className="flex gap-3 pb-2">
              <PopButton
                size="sm"
                pressed={dim === 2}
                onClick={() => setDim(2)}
                aria-label="2D mode"
              >
                2D
              </PopButton>
              <PopButton
                size="sm"
                pressed={dim === 3}
                onClick={() => setDim(3)}
                aria-label="3D mode"
              >
                3D
              </PopButton>
            </div>
          </section>

          <VectorInputs dim={dim} a={a} b={b} onChangeA={setA} onChangeB={setB} />

          <OperationSelector
            dim={dim}
            op={op}
            helpOp={helpOp}
            onChange={(next) => {
              setOp(next);
              setHelpOp((cur) => (cur && cur !== next ? null : cur));
            }}
            onToggleHelp={(id) => setHelpOp((cur) => (cur === id ? null : id))}
          />

          <ScalarControls
            op={op}
            scalar={scalar}
            s={s}
            t={t}
            onScalar={setScalar}
            onS={setS}
            onT={setT}
          />

          <MatrixInputs
            dim={dim}
            op={op}
            matrixM={matrixM}
            matrixN={matrixN}
            onChangeM={setMatrixM}
            onChangeN={setMatrixN}
          />

          <OutputPanel model={model} />

          <div className="pt-2 pb-4">
            <PopButton size="sm" onClick={reset}>
              Reset
            </PopButton>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="relative min-h-[360px] flex-1 border border-[#1f1f1f] bg-black lg:min-h-[calc(100vh-8.5rem)]">
            {dim === 2 ? (
              <Canvas2D model={model} />
            ) : (
              <Suspense fallback={null}>
                <Canvas3D
                  model={model}
                  azimuth={azimuth}
                  onAzimuthChange={setAzimuth}
                />
              </Suspense>
            )}
            <Legend />
          </div>
          {dim === 3 ? (
            <RotateSlider value={azimuth} onChange={setAzimuth} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
