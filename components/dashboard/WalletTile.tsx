import type { ReactNode } from "react";

export type WalletEntry = { label: string; /** null = no data source yet. */ value: string | null };

/**
 * Wallet figure tile (vendor + admin wallet blocks): one or two amounts with labels and an
 * iris icon chip on the right. Missing amounts render as a dash, never a made-up figure.
 */
export function WalletTile({
  entries,
  icon,
  align = "start",
}: {
  entries: WalletEntry[];
  icon: ReactNode;
  /** start = vendor mockup (chip top-aligned), center = admin mockup. */
  align?: "start" | "center";
}) {
  return (
    <div
      className={`flex flex-1 justify-between gap-3 rounded-xl border border-line-soft bg-bg-subtle p-5 ${
        align === "start" ? "items-start" : "items-center"
      }`}
    >
      <div>
        {entries.map((entry, i) => (
          <div key={entry.label} className={i > 0 ? "mt-3.5" : ""}>
            <div className={`font-display text-21 leading-none font-extrabold ${entry.value === null ? "text-muted-soft" : "text-ink"}`}>
              {entry.value ?? <Dash />}
            </div>
            <div className="mt-1.75 text-12-5 leading-none text-muted">{entry.label}</div>
          </div>
        ))}
      </div>
      <span className="flex size-11 flex-none items-center justify-center rounded-control bg-iris-50 text-iris-500">{icon}</span>
    </div>
  );
}

export function Dash() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">No data yet</span>
    </>
  );
}
