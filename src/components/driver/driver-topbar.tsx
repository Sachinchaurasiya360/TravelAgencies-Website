"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Car } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useT } from "@/lib/i18n/language-context";

export function DriverTopbar() {
  const { data: session } = useSession();
  const t = useT();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
          <Car className="h-4 w-4 text-orange-500" />
        </div>
        <span className="font-semibold text-sm">{t.nav.companyName}</span>
      </div>

      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                  {session?.user?.name?.[0]?.toUpperCase() || "D"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{t.driver.roleLabel}</p>
            </div>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t.common.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
