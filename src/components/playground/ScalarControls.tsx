import { Slider } from "@/components/ui/slider";
import { fmt } from "@/lib/math";
import type { Operation } from "@/lib/types";
import { Section } from "./Section";

interface ScalarControlsProps {
  op: Operation;
  scalar: number;
  s: number;
  t: number;
  onScalar: (n: number) => void;
  onS: (n: number) => void;
  onT: (n: number) => void;
}

function LabeledSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-xs text-[#555]">
          {label}
        </label>
        <span className="font-mono text-sm text-[#f9d4d4]">{fmt(value)}</span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          if (typeof v[0] === "number") onChange(v[0]);
        }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      />
    </div>
  );
}

export function ScalarControls({
  op,
  scalar,
  s,
  t,
  onScalar,
  onS,
  onT,
}: ScalarControlsProps) {
  if (op === "scalar") {
    return (
      <Section title="Scalar">
        <LabeledSlider
          id="scalar-k"
          label="k"
          value={scalar}
          min={-5}
          max={5}
          step={0.1}
          onChange={onScalar}
        />
      </Section>
    );
  }

  if (op === "span") {
    return (
      <Section title="Coefficients">
        <div className="space-y-3">
          <LabeledSlider
            id="span-s"
            label="s  (weight on A)"
            value={s}
            min={-3}
            max={3}
            step={0.1}
            onChange={onS}
          />
          <LabeledSlider
            id="span-t"
            label="t  (weight on B)"
            value={t}
            min={-3}
            max={3}
            step={0.1}
            onChange={onT}
          />
        </div>
      </Section>
    );
  }

  return null;
}
