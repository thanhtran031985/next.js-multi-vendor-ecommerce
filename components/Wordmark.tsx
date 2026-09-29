/** "Covet." wordmark: Sora 800 with a colored period (DESIGN_SYSTEM §1). */
export function Wordmark({ className = "", dotClassName = "text-iris-500" }: { className?: string; dotClassName?: string }) {
  return (
    <span className={`font-display leading-none font-extrabold tracking-display ${className}`}>
      Covet<span className={dotClassName}>.</span>
    </span>
  );
}
