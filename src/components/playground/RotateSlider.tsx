interface RotateSliderProps {
  value: number;
  onChange: (deg: number) => void;
}

export function RotateSlider({ value, onChange }: RotateSliderProps) {
  return (
    <div className="mt-4 shrink-0 space-y-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor="orbit-rotate" className="text-[11px] uppercase tracking-[0.22em] text-[#555]">
          Rotate
        </label>
        <span className="font-mono text-xs text-[#555]">{Math.round(value)}°</span>
      </div>
      <input
        id="orbit-rotate"
        className="orbit-slider"
        type="range"
        min={0}
        max={360}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(value)}
        aria-label="Rotate camera around the scene"
      />
    </div>
  );
}
