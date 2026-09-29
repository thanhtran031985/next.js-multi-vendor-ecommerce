import { HeartIcon, MapPinIcon, TruckIcon, UserIcon } from "@/components/icons";
import {
  AwardIcon,
  BagIcon,
  BarChartIcon,
  BoxIcon,
  HomeIcon,
  LayoutIcon,
  LifeBuoyIcon,
  MailIcon,
  MonitorIcon,
  RefreshIcon,
  SendIcon,
  ShareIcon,
  SlidersIcon,
  SpeakerIcon,
  TicketIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons/dashboard";
import type { NavIconName } from "@/lib/dashboard/nav";

/** Renders the icon named in lib/dashboard/nav.ts. */
export function NavIcon({ name, size, strokeWidth = 1.9 }: { name: NavIconName; size: number; strokeWidth?: number }) {
  const p = { size, strokeWidth };
  switch (name) {
    case "home":
      return <HomeIcon {...p} />;
    case "box":
      return <BoxIcon {...p} />;
    case "bag":
      return <BagIcon {...p} />;
    case "send":
      return <SendIcon {...p} />;
    case "speaker":
      return <SpeakerIcon {...p} />;
    case "chart":
      return <BarChartIcon bars={2} {...p} />;
    case "users":
      return <UsersIcon {...p} />;
    case "sliders":
      return <SlidersIcon {...p} />;
    case "layout":
      return <LayoutIcon {...p} />;
    case "monitor":
      return <MonitorIcon {...p} />;
    case "user":
      return <UserIcon {...p} />;
    case "orders":
      return <BoxIcon spine {...p} />;
    case "refresh":
      return <RefreshIcon {...p} />;
    case "heart":
      return <HeartIcon {...p} />;
    case "wallet":
      return <WalletIcon {...p} />;
    case "award":
      return <AwardIcon {...p} />;
    case "mail":
      return <MailIcon {...p} />;
    case "pin":
      return <MapPinIcon {...p} />;
    case "life":
      return <LifeBuoyIcon {...p} />;
    case "share":
      return <ShareIcon {...p} />;
    case "ticket":
      return <TicketIcon {...p} />;
    case "truck":
      return <TruckIcon {...p} />;
  }
}
