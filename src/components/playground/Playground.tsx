import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

function Canvas3DFallback({ message = "Loading 3D view..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-sm leading-relaxed text-[#888]">
      <p>{message}</p>
    </div>
  );
}

class Canvas3DErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D view crashed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Canvas3DFallback message="3D view could not start in this browser." />
      );
    }

    return this.props.children;
  }
}

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

const HEADER_LINKS = [
  {
    href: "https://x.com/gudakesh_07",
    label: "Open X profile",
    icon: "X",
  },
  {
    href: "https://github.com/gudakesh07/LinearAlgebraPlayground",
    label: "Open GitHub repository",
    icon: "github",
  },
] as const;

function HeaderLinkIcon({ icon }: { icon: (typeof HEADER_LINKS)[number]["icon"] }) {
  if (icon === "github") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 fill-current"
      >
        <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.49 2.87 8.3 6.84 9.69.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.93c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.2 10.2 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
      </svg>
    );
  }

  return (
    <span aria-hidden="true" className="text-sm font-bold leading-none">
      X
    </span>
  );
}

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
    <div className="fixed inset-0 flex h-svh max-h-svh w-full flex-col overflow-hidden bg-black text-[#f0f0f0]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#1f1f1f] px-4 py-2 sm:px-5">
        <h1 className="text-sm font-medium tracking-wide">
          Linear Algebra Playground
        </h1>
        <nav aria-label="Project links" className="flex shrink-0 items-center gap-2">
          {HEADER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              title={link.label}
              className={[
                "inline-flex h-8 w-8 items-center justify-center border-2 border-[#b18597] bg-[#f9d4d4] text-black shadow-[0_4px_0_-2px_#f9c4d2,0_4px_0_0_#b18597] transition-all hover:translate-y-0.5 hover:bg-[#fce0e0] hover:shadow-[0_3px_0_-2px_#f9c4d2,0_3px_0_0_#b18597] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0a0a0] active:translate-y-1 active:shadow-none",
                link.icon === "X" ? "x-attention-pulse" : "",
              ].join(" ")}
            >
              <HeaderLinkIcon icon={link.icon} />
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto grid w-full min-h-0 max-w-[1600px] flex-1 grid-cols-1 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-3 overflow-hidden px-4 py-3 sm:px-5 md:grid-cols-[minmax(360px,430px)_minmax(0,1fr)] md:grid-rows-1 lg:gap-5">
        <div className="flex h-full min-h-0 min-w-0 flex-col gap-6 overflow-y-auto border border-[#1f1f1f] bg-black p-5">
          <div className="flex shrink-0 items-end justify-between gap-4">
            <section className="shrink-0">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#555]">
                Mode
              </h2>
              <div className="mt-2 flex gap-3 pb-1">
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
          </div>

          <div className="grid shrink-0 gap-6">
            <VectorInputs
              dim={dim}
              a={a}
              b={b}
              onChangeA={setA}
              onChangeB={setB}
            />
          </div>

          <div className="grid shrink-0 gap-6">
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
          </div>

          <OutputPanel model={model} />

          <div className="shrink-0 pt-0">
            <PopButton size="sm" onClick={reset}>
              Reset
            </PopButton>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1 overflow-hidden border border-[#1f1f1f] bg-black">
            {dim === 2 ? (
              <Canvas2D model={model} />
            ) : (
              <Canvas3DErrorBoundary>
                <Suspense fallback={<Canvas3DFallback />}>
                  <Canvas3D
                    model={model}
                    azimuth={azimuth}
                    onAzimuthChange={setAzimuth}
                  />
                </Suspense>
              </Canvas3DErrorBoundary>
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
