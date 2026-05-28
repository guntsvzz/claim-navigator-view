import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Hospital,
  Gauge,
  Briefcase,
  Users,
  Share2,
  ListTodo,
  UsersRound,
  Workflow,
  Settings,
} from "lucide-react";
import { useView } from "@/lib/view-store";
import { cn } from "@/lib/utils";

const primaryNav = [
  { key: "dashboard", label: "Dashboard", icon: Gauge, to: "/" },
  { key: "executive", label: "Executive Dashboard", icon: Briefcase, to: "/executive" },
  { key: "account", label: "Account 360", icon: Users, to: "/account-360" },
  { key: "social", label: "Social Listener", icon: Share2, to: "/social-listener" },
  { key: "task", label: "Task", icon: ListTodo, to: "/task" },
] as const;

const secondaryNav = [
  { key: "users", label: "User Management", icon: UsersRound, to: "/user-management" },
  { key: "team", label: "Team Management", icon: Workflow, to: "/team-management" },
  { key: "system", label: "System Settings", icon: Settings, to: "/system-settings" },
] as const;

export function Sidebar() {
  const { view, setView } = useView();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="px-5 py-5">
        <div className="text-xs font-medium text-muted-foreground">Mode</div>
        <div className="mt-2 inline-flex w-full rounded-md bg-muted p-1">
          {([
            { v: "insurer" as const, label: "Insurer", Icon: Building2 },
            { v: "provider" as const, label: "Provider", Icon: Hospital },
          ]).map(({ v, label, Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-[5px] px-3 py-2 text-sm font-semibold transition-all",
                view === v
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {primaryNav.map((item) => (
          <NavItem key={item.key} {...item} active={path === item.to} />
        ))}

        <div className="my-3 border-t border-border" />

        {secondaryNav.map((item) => (
          <NavItem key={item.key} {...item} active={path === item.to} />
        ))}
      </nav>
    </aside>
  );
}

function NavItem({
  label,
  icon: Icon,
  to,
  active,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground/80 hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}
