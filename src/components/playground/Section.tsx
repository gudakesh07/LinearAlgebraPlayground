import type { ReactNode } from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#555]">
        {title}
      </h2>
      {children}
    </section>
  );
}
