"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Users, Briefcase, FileText, Receipt, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "", icon: LayoutDashboard, key: "dashboard" },
  { href: "/clients", icon: Users, key: "clients" },
  { href: "/cases", icon: Briefcase, key: "cases" },
  { href: "/invoices", icon: Receipt, key: "invoices" },
  { href: "/chat", icon: MessageCircle, key: "chat" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export function Sidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <aside className="hidden lg:flex lg:w-60 shrink-0 flex-col border-r bg-card">
      <div className="px-6 py-5 border-b">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            LB
          </div>
          <div>
            <div className="text-sm font-semibold">{tn("brand")}</div>
            <div className="text-xs text-muted-foreground">{tn("brandTagline")}</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, icon: Icon, key }) => {
          const full = `/${locale}${href}`;
          const active = href === "" ? pathname === full : pathname.startsWith(full);
          return (
            <Link
              key={key}
              href={full}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
