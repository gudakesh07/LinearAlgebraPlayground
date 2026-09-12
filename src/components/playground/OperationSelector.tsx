import { useRef, type KeyboardEvent } from "react";
import { OPERATIONS, type Dim, type Operation } from "@/lib/types";
import { Section } from "./Section";

interface OperationSelectorProps {
  dim: Dim;
  op: Operation;
  helpOp: Operation | null;
  onChange: (op: Operation) => void;
  onToggleHelp: (op: Operation) => void;
}

export function OperationSelector({
  dim,
  op,
  helpOp,
  onChange,
  onToggleHelp,
}: OperationSelectorProps) {
  const tabRefs = useRef<Map<Operation, HTMLButtonElement>>(new Map());
  const help = OPERATIONS.find((item) => item.id === helpOp);

  const enabled = OPERATIONS.filter(
    (item) => !(item.requires3D && dim === 2),
  );

  function focusOp(id: Operation) {
    tabRefs.current.get(id)?.focus();
  }

  function onKeyDown(e: KeyboardEvent, current: Operation) {
    const ids = enabled.map((item) => item.id);
    const i = ids.indexOf(current);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = ids[(i + 1) % ids.length];
      onChange(next);
      focusOp(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = ids[(i - 1 + ids.length) % ids.length];
      onChange(next);
      focusOp(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(ids[0]);
      focusOp(ids[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(ids[ids.length - 1]);
      focusOp(ids[ids.length - 1]);
    }
  }

  return (
    <Section title="Operation">
      <div
        role="tablist"
        aria-label="Linear algebra operation"
        className="flex flex-wrap gap-x-2 gap-y-3"
      >
        {OPERATIONS.map((item) => {
          const disabled = Boolean(item.requires3D && dim === 2);
          const selected = op === item.id;
          return (
            <div key={item.id} className="flex items-center">
              <button
                ref={(el) => {
                  if (el) tabRefs.current.set(item.id, el);
                  else tabRefs.current.delete(item.id);
                }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-disabled={disabled || undefined}
                tabIndex={selected ? 0 : -1}
                disabled={disabled}
                title={disabled ? "Cross product needs 3D" : item.fullName}
                onClick={() => onChange(item.id)}
                onKeyDown={(e) => onKeyDown(e, item.id)}
                className={[
                  "border-b-2 px-2 py-1 font-mono text-xs tracking-wide transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0a0a0]",
                  disabled
                    ? "cursor-not-allowed border-transparent text-[#333] opacity-40"
                    : selected
                      ? "border-[#f9d4d4] text-[#f9d4d4]"
                      : "border-transparent text-[#555] hover:text-[#f0f0f0]",
                ].join(" ")}
              >
                {item.label}
              </button>
              <button
                type="button"
                aria-label={`About ${item.fullName}`}
                aria-expanded={helpOp === item.id}
                aria-controls="operation-help"
                onClick={() => onToggleHelp(item.id)}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#2a2a2a] text-[10px] leading-none text-[#555] transition-colors hover:border-[#e0a0a0] hover:text-[#f9d4d4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0a0a0]"
              >
                ?
              </button>
            </div>
          );
        })}
      </div>
      {help ? (
        <p
          id="operation-help"
          role="note"
          className="max-w-prose text-sm leading-relaxed text-[#888]"
        >
          <span className="text-[#f9d4d4]">{help.fullName}.</span> {help.help}
        </p>
      ) : null}
    </Section>
  );
}
