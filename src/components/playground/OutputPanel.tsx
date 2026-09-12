import type { SceneModel } from "@/lib/types";

export function OutputPanel({ model }: { model: SceneModel }) {
  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className="h-[112px] shrink-0 overflow-y-auto border border-[#1f1f1f] bg-black px-3 py-3"
    >
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#555]">
        Output
      </h2>
      <p className="font-mono text-sm leading-snug text-[#f0f0f0]">
        <span className="text-[#f9d4d4]">&gt; </span>
        {model.resultText}
      </p>
      <p className="mt-2 font-mono text-sm leading-snug text-[#555]">
        {model.interpretation}
      </p>
    </section>
  );
}
