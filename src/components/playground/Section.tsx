import type { ReactNode } from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="shrink-0">
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#555]">
        {title}
      </h2>
      {children}
    </section>
  );
}
