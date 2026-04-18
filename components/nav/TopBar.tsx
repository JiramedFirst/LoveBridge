"use client";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/nav/LocaleSwitcher";
import { MobileNav } from "@/components/nav/MobileNav";

export function TopBar({
  locale,
  userName,
  userRole,
}: {
  locale: string;
  userName: string;
  userRole: string;
}) {
  const t = useTranslations("common");
  return (
    <header className="topbar flex h-14 items-center justify-between gap-3 border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <MobileNav locale={locale} />
      </div>
      <div className="flex items-center gap-3">
        <LocaleSwitcher locale={locale} />
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{userName}</span>
          <span className="text-xs text-muted-foreground uppercase">{userRole}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t("signOut")}</span>
        </Button>
      </div>
    </header>
  );
}
