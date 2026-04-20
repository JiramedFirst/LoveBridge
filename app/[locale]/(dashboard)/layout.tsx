import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/nav/Sidebar";
import { TopBar } from "@/components/nav/TopBar";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen">
        <Sidebar locale={locale} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            locale={locale}
            userName={session.user.name ?? ""}
            userRole={session.user.role}
          />
          <main className="flex-1 p-4 md:p-6 bg-muted/30">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
