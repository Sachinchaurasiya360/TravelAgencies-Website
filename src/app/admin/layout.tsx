import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { SidebarProvider } from "@/components/admin/sidebar-context";
import { LanguageProvider } from "@/lib/i18n/language-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Not authenticated (e.g. /admin/login) — render without sidebar/topbar
  if (!session) {
    return <LanguageProvider>{children}</LanguageProvider>;
  }

  return (
    <LanguageProvider>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </LanguageProvider>
  );
}
