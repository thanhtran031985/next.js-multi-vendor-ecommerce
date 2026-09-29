import type { ComponentType } from "react";
import { BlogIcon, BuildingIcon, ChatIcon, HelpIcon } from "@/components/icons";

const cards: { title: string; sub: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { title: "About us", sub: "Know more about our company", Icon: BuildingIcon },
  { title: "Contact Us", sub: "We are here to help", Icon: ChatIcon },
  { title: "FAQ", sub: "Get all your answers", Icon: HelpIcon },
  { title: "Blog", sub: "Check our latest posts", Icon: BlogIcon },
];

/** "About / Contact / FAQ / Blog" cards above the footer. `compact` = vendor register mockup. */
export function HelpCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-5">
      {cards.map(({ title, sub, Icon }) => (
        <a
          key={title}
          href="#"
          className={`flex flex-col items-center rounded-xl border border-line-soft bg-surface text-center shadow-xs transition-[box-shadow,transform] duration-250 hover:-translate-y-0.75 hover:shadow-md ${
            compact ? "gap-3 px-5.5 py-7.5" : "gap-3.5 px-6 py-8"
          }`}
        >
          <span
            className={`flex items-center justify-center bg-iris-50 text-iris-500 ${
              compact ? "size-13 rounded-lg" : "size-14 rounded-xl"
            }`}
          >
            <Icon size={compact ? 24 : 22} strokeWidth={1.9} />
          </span>
          <span>
            <span className={`block font-display leading-110 font-bold text-ink ${compact ? "text-15" : "text-16"}`}>
              {title}
            </span>
            <span className={`mt-1.75 block leading-140 text-muted ${compact ? "text-12-5" : "text-13"}`}>{sub}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
