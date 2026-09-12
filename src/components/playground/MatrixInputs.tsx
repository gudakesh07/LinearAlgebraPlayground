import { NumberField } from "./NumberField";
import { Section } from "./Section";
import { setMatCell } from "@/lib/math";
import type { Dim, Operation } from "@/lib/types";

interface MatrixInputsProps {
  dim: Dim;
  op: Operation;
  matrixM: number[][];
  matrixN: number[][];
  onChangeM: (m: number[][]) => void;
  onChangeN: (m: number[][]) => void;
}

function MatrixGrid({
  name,
  dim,
  matrix,
  onChange,
}: {
  name: "M" | "N";
  dim: Dim;
  matrix: number[][];
  onChange: (m: number[][]) => void;
}) {
  const n = dim;
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="select-none text-3xl font-light leading-none text-[#555]"
      >
        [
      </span>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, auto))` }}
        role="group"
        aria-label={`Matrix ${name}, ${n} by ${n}`}
      >
        {Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) => (
            <NumberField
              key={`${name}-${i}-${j}`}
              id={`${name}-${i}-${j}`}
              label=""
              ariaLabel={`Matrix ${name} row ${i + 1} column ${j + 1}`}
              value={matrix[i]?.[j] ?? (i === j ? 1 : 0)}
              onChange={(v) => onChange(setMatCell(matrix, i, j, v))}
            />
          )),
        )}
      </div>
      <span
        aria-hidden="true"
        className="select-none text-3xl font-light leading-none text-[#555]"
      >
        ]
      </span>
    </div>
  );
}

export function MatrixInputs({
  dim,
  op,
  matrixM,
  matrixN,
  onChangeM,
  onChangeN,
}: MatrixInputsProps) {
  if (op !== "matrix-vector" && op !== "matrix-matrix") return null;

  return (
    <>
      <Section title={op === "matrix-matrix" ? "Matrix M  (applied second)" : "Matrix M"}>
        <MatrixGrid name="M" dim={dim} matrix={matrixM} onChange={onChangeM} />
      </Section>
      {op === "matrix-matrix" ? (
        <Section title="Matrix N  (applied first)">
          <MatrixGrid name="N" dim={dim} matrix={matrixN} onChange={onChangeN} />
        </Section>
      ) : null}
    </>
  );
}
