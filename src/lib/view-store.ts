import { createContext, useContext } from "react";
import type { ViewMode } from "./mock-data";

export type ViewState = {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  entityId: string;
  setEntityId: (id: string) => void;
};

export const ViewCtx = createContext<ViewState | null>(null);

export function useView() {
  const v = useContext(ViewCtx);
  if (!v) throw new Error("useView must be used within ViewProvider");
  return v;
}
