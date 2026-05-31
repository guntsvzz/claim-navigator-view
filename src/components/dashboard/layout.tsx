import { useState, type ReactNode } from "react";
import { ViewCtx } from "@/lib/view-store";
import type { ViewMode } from "@/lib/mock-data";
import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewMode>("insurer");
  const [entityId, setEntityId] = useState("ALL");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ViewCtx.Provider
      value={{
        view,
        setView: (v) => {
          setView(v);
          setEntityId("ALL");
        },
        entityId,
        setEntityId,
      }}
    >
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </ViewCtx.Provider>
  );
}
