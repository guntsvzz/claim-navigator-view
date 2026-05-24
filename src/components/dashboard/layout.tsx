import { useState, type ReactNode } from "react";
import { ViewCtx } from "@/lib/view-store";
import type { ViewMode } from "@/lib/mock-data";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewMode>("insurer");
  const [entityId, setEntityId] = useState("INS001");

  return (
    <ViewCtx.Provider
      value={{
        view,
        setView: (v) => {
          setView(v);
          setEntityId(v === "insurer" ? "INS001" : "PRV001");
        },
        entityId,
        setEntityId,
      }}
    >
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-x-hidden p-6">{children}</main>
        </div>
      </div>
    </ViewCtx.Provider>
  );
}
