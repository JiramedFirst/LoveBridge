import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ConversationList } from "@/components/chat/ConversationList";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("chat");

  const contacts = await prisma.lineContact.findMany({
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { text: true, direction: true, messageType: true, createdAt: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[calc(100vh-8rem)]">
      <ConversationList
        locale={locale}
        conversations={contacts.map((c) => ({
          id: c.id,
          displayName: c.displayName,
          pictureUrl: c.pictureUrl,
          unreadCount: c.unreadCount,
          clientName: c.client ? `${c.client.firstName} ${c.client.lastName}` : null,
          lastMessage: c.messages[0]?.text ?? (c.messages[0] ? `[${c.messages[0].messageType}]` : null),
          lastMessageAt: c.lastMessageAt.toISOString(),
        }))}
      />
      <div className="rounded-lg border bg-card grid place-items-center text-muted-foreground text-sm">
        {t("selectConversation")}
      </div>
    </div>
  );
}
