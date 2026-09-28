import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Filter,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSettings } from "@/lib/store";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pipeline", href: "/pipeline", icon: Filter },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Qualification", href: "/qualification", icon: Target },
  { name: "Routing", href: "/routing", icon: UserCheck },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  return (
    <aside
      className={cn("app-sidebar fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200", collapsed ? "is-collapsed w-[4.25rem]" : "w-60")}
    >
      {/* Logo */}
      <div className="flex h-[4.25rem] shrink-0 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <Logo size="md" showText={true} />
        )}
        {collapsed && (
          <Logo size="md" showText={false} className="mx-auto" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-7">
        <div className="space-y-1">
          {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-sidebar-foreground/45">Workspace</p>}
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
                  isActive
                    ? "relative bg-sidebar-accent text-sidebar-accent-foreground font-medium before:absolute before:left-0 before:h-5 before:w-[2px] before:rounded-r before:bg-sidebar-primary"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-[17px] w-[17px] shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Divider */}
        {/* Secondary Navigation */}
        <div className="space-y-0.5">
          {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-sidebar-foreground/45">Manage</p>}
          {[...(user?.role === 'admin' ? [{ name: "Team", href: "/team", icon: Users }] : []), ...secondaryNavigation].map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-[17px] w-[17px] shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-foreground">{(user?.email?.[0] ?? 'E').toUpperCase()}</div>
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-sidebar-foreground">{user?.email ?? 'Demo workspace'}</p><p className="mt-0.5 text-[10px] capitalize text-sidebar-foreground/45">{user?.role ?? (settings.systemActive ? 'Prototype' : 'Workspace')}</p></div>}
          <button type="button" title={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={onToggle} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
