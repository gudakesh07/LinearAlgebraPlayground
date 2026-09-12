import { NumberField } from "./NumberField";
import { Section } from "./Section";
import type { Dim, Vec3 } from "@/lib/types";

interface VectorInputsProps {
  dim: Dim;
  a: Vec3;
  b: Vec3;
  onChangeA: (v: Vec3) => void;
  onChangeB: (v: Vec3) => void;
}

function AxisRow({
  name,
  vec,
  dim,
  onChange,
}: {
  name: "A" | "B";
  vec: Vec3;
  dim: Dim;
  onChange: (v: Vec3) => void;
}) {
  const prefix = name.toLowerCase();
  const axes = dim === 3 ? (["x", "y", "z"] as const) : (["x", "y"] as const);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
      {axes.map((axis) => (
        <NumberField
          key={axis}
          id={`${prefix}-${axis}`}
          label={`${axis} =`}
          value={vec[axis]}
          onChange={(n) => onChange({ ...vec, [axis]: n })}
        />
      ))}
    </div>
  );
}

export function VectorInputs({
  dim,
  a,
  b,
  onChangeA,
  onChangeB,
}: VectorInputsProps) {
  return (
    <>
      <Section title="Vector A">
        <AxisRow name="A" vec={a} dim={dim} onChange={onChangeA} />
      </Section>
      <Section title="Vector B">
        <AxisRow name="B" vec={b} dim={dim} onChange={onChangeB} />
      </Section>
    </>
  );
}
