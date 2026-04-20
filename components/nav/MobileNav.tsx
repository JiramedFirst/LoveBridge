"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, LayoutDashboard, Users, Briefcase, Receipt, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "", icon: LayoutDashboard, key: "dashboard" },
  { href: "/clients", icon: Users, key: "clients" },
  { href: "/cases", icon: Briefcase, key: "cases" },
  { href: "/invoices", icon: Receipt, key: "invoices" },
  { href: "/chat", icon: MessageCircle, key: "chat" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export function MobileNav({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-semibold">LoveBridge</div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-2 space-y-1">
              {NAV.map(({ href, icon: Icon, key }) => {
                const full = `/${locale}${href}`;
                const active = href === "" ? pathname === full : pathname.startsWith(full);
                return (
                  <Link
                    key={key}
                    href={full}
                    onClick={() => setOpen(false)}
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
          </div>
        </div>
      )}
    </>
  );
}
