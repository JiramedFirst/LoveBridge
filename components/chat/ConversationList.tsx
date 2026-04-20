"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  displayName: string;
  pictureUrl: string | null;
  unreadCount: number;
  clientName: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
};

export function ConversationList({
  locale,
  conversations,
}: {
  locale: string;
  conversations: Conversation[];
}) {
  const pathname = usePathname();
  const t = useTranslations("chat");

  return (
    <aside className="rounded-lg border bg-card overflow-hidden flex flex-col">
      <div className="p-3 border-b font-semibold">{t("title")}</div>
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">{t("noConversation")}</div>
        )}
        {conversations.map((c) => {
          const href = `/${locale}/chat/${c.id}`;
          const active = pathname === href;
          return (
            <Link
              key={c.id}
              href={href}
              className={cn(
                "flex items-start gap-3 border-b px-3 py-2 hover:bg-accent",
                active && "bg-accent",
              )}
            >
              {c.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.pictureUrl}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/20 text-primary grid place-items-center text-sm font-semibold shrink-0">
                  {c.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-sm truncate">{c.displayName}</span>
                  {c.unreadCount > 0 && (
                    <span className="rounded-full bg-primary text-primary-foreground text-[10px] leading-none px-1.5 py-0.5">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.clientName && (
                  <div className="text-xs text-primary truncate">🔗 {c.clientName}</div>
                )}
                <div className="text-xs text-muted-foreground truncate">
                  {c.lastMessage ?? "—"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
