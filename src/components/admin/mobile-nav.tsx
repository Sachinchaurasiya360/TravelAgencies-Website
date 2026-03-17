"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
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
  Wallet,
  Truck,
} from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Bus className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold">{t.nav.companyName}</span>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
