import { auth } from "@/lib/auth";
import { DriverTopbar } from "@/components/driver/driver-topbar";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/lib/i18n/language-context";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <div className="flex min-h-screen flex-col bg-gray-50">
          <DriverTopbar />
          <main className="flex-1 px-4 py-4">{children}</main>
        </div>
      </LanguageProvider>
    </SessionProvider>
  );
}
