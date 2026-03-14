"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useT } from "@/lib/i18n/language-context";

export function Topbar() {
  const { data: session } = useSession();
  const t = useT();

  return (
    <header className="bg-background flex h-16 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        <h2 className="text-lg font-semibold md:hidden">{t.nav.companyName}</h2>
      </div>

      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {session?.user?.name?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <div className="flex items-center gap-2 p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-muted-foreground text-xs">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
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
