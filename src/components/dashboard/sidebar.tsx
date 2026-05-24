import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ListChecks,
  TrendingUp,
  Map as MapIcon,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/work-queue", label: "Work Queue", icon: ListChecks },
  { to: "/performance", label: "Performance", icon: TrendingUp },
  { to: "/area-map", label: "Area Map", icon: MapIcon },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
          <Activity className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">CLAIM OPS</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Command Center
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary",
              }}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live · sync 2s ago
        </div>
      </div>
    </aside>
  );
}
