import { Button } from "@/components/ui/button";
import { Activity, Bell, CalendarDays, Filter } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">CLAIM OPS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Command Center
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <CalendarDays className="h-3.5 w-3.5" /> Last 30 days
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="h-3.5 w-3.5" /> Filters
            <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              3
            </span>
          </Button>
          <Button variant="outline" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
          </Button>
        </div>
      </div>
    </header>
  );
}
