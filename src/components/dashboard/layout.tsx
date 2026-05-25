import { useState, type ReactNode } from "react";
import { ViewCtx } from "@/lib/view-store";
import type { ViewMode } from "@/lib/mock-data";
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
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TopBar />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-6">{children}</main>
      </div>
    </ViewCtx.Provider>
  );
}
