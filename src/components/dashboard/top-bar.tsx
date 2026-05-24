import { useView } from "@/lib/view-store";
import { insurers, providers } from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, Hospital, CalendarDays, Filter, Search, Bell } from "lucide-react";

export function TopBar() {
  const { view, setView, entityId, setEntityId } = useView();
  const list = view === "insurer" ? insurers : providers;
  const Icon = view === "insurer" ? Building2 : Hospital;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-6">
        {/* View switcher */}
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(["insurer", "provider"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`relative px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-[5px] transition-all ${
                view === v
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v} View
            </button>
          ))}
        </div>

        {/* Entity dropdown */}
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger className="w-[260px] h-9 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {list.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {e.code}
                  </span>
                  {e.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mx-2 h-6 w-px bg-border" />

        {/* Quick filters */}
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-card">
          <CalendarDays className="h-3.5 w-3.5" /> Last 30 days
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-card">
          <Filter className="h-3.5 w-3.5" /> All filters
          <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search claim no., TPA no…"
              className="h-9 w-72 rounded-md border border-border bg-card pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 bg-card relative">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
          </Button>
        </div>
      </div>
    </header>
  );
}
