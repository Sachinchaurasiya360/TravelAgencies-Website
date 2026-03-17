"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useT } from "@/lib/i18n/language-context";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Activity,
  Settings,
  Bus,
  UserCheck,
  PanelLeftClose,
  PanelLeft,
  Wallet,
  Truck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const t = useT();

  const navItems = [
    { href: "/admin", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/admin/bookings", label: t.nav.bookings, icon: CalendarCheck },
    { href: "/admin/customers", label: t.nav.customers, icon: Users },
    { href: "/admin/drivers", label: t.nav.drivers, icon: UserCheck },
    { href: "/admin/vendors", label: t.nav.vendors, icon: Truck },
    { href: "/admin/invoices", label: t.nav.invoices, icon: FileText },
    { href: "/admin/payments", label: t.nav.payments, icon: CreditCard },
    { href: "/admin/expenses", label: t.nav.expenses, icon: Wallet },
    { href: "/admin/reports", label: t.nav.reports, icon: BarChart3 },
    { href: "/admin/reminders", label: t.nav.reminders, icon: Bell },
    { href: "/admin/activity-logs", label: t.nav.activityLogs, icon: Activity },
    { href: "/admin/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-background hidden shrink-0 border-r md:flex md:flex-col transition-all duration-200",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b",
            collapsed ? "justify-center px-2" : "gap-2 px-6"
          )}
        >
          <Bus className="h-6 w-6 shrink-0 text-blue-600" />
          {!collapsed && (
            <span className="text-lg font-bold whitespace-nowrap overflow-hidden">
              {t.nav.companyName}
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            const link = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{link}</div>;
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-gray-400 transition-colors hover:bg-muted hover:text-gray-600"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t.nav.expand}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={toggle}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-muted hover:text-gray-600"
            >
              <PanelLeftClose className="h-4 w-4" />
              <span>{t.nav.collapse}</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
