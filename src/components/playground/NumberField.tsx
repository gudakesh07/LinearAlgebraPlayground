import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmt, parseScalar } from "@/lib/math";

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  disabled,
  ariaLabel,
}: NumberFieldProps) {
  const [raw, setRaw] = useState(() => fmt(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setRaw(fmt(value));
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      {label ? (
        <Label
          htmlFor={id}
          className="w-7 shrink-0 font-mono text-xs font-normal text-[#555]"
        >
          {label}
        </Label>
      ) : (
        <label htmlFor={id} className="sr-only">
          {ariaLabel ?? id}
        </label>
      )}
      <Input
        id={id}
        aria-label={ariaLabel}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={raw}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(e) => {
          const next = e.target.value;
          setRaw(next);
          const parsed = parseScalar(next);
          if (parsed !== null) onChange(parsed);
        }}
        onBlur={() => {
          focusedRef.current = false;
          const parsed = parseScalar(raw);
          setRaw(fmt(parsed ?? value));
        }}
        className="h-9 w-[4.75rem] rounded-none border-[#2a2a2a] bg-black px-2 font-mono text-sm text-[#f0f0f0] shadow-none focus-visible:border-[#e0a0a0] focus-visible:ring-2 focus-visible:ring-[#f9d4d4]/35 dark:bg-black"
      />
    </div>
  );
}
