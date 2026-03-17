"use client";

import { LanguageProvider } from "@/lib/i18n/language-context";
import { Bus } from "lucide-react";

export default function DriverRideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-center border-b bg-white px-4">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-bold">Sarthak Travels</span>
          </div>
        </header>
        <main className="flex-1 px-4 py-4">{children}</main>
      </div>
    </LanguageProvider>
  );
}
