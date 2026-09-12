import type { SceneModel } from "@/lib/types";

export function OutputPanel({ model }: { model: SceneModel }) {
  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className="border border-[#1f1f1f] bg-black px-4 py-4"
    >
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#555]">
        Output
      </h2>
      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[#f0f0f0]">
        <span className="text-[#f9d4d4]">&gt; </span>
        {model.resultText}
      </pre>
      <p className="mt-3 font-mono text-sm leading-relaxed text-[#555]">
        {model.interpretation}
      </p>
    </section>
  );
}
