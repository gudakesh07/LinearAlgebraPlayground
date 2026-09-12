import { COLORS } from "@/lib/types";

const ITEMS = [
  { label: "A", color: COLORS.vectorA },
  { label: "B", color: COLORS.vectorB },
  { label: "result", color: COLORS.result },
] as const;

export function Legend() {
  return (
    <ul className="pointer-events-none absolute top-3 right-3 flex gap-4 text-[11px] tracking-wide text-[#555]">
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
