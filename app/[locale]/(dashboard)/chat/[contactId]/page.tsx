import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { sendLineMessage, linkContactToClient, markContactRead } from "@/lib/actions/chat";

export default async function ChatContactPage({
  params,
}: {
  params: Promise<{ locale: string; contactId: string }>;
}) {
  const { locale, contactId } = await params;

  const contact = await prisma.lineContact.findUnique({
    where: { id: contactId },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
      },
    },
  });
  if (!contact) notFound();

  const [contacts, clients] = await Promise.all([
    prisma.lineContact.findMany({
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { text: true, direction: true, messageType: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true },
      take: 200,
    }),
  ]);

  // Mark inbound messages as read
  if (contact.unreadCount > 0) {
    await markContactRead(locale, contactId);
  }

  const sendAction = sendLineMessage.bind(null, locale, contactId);
  const linkAction = linkContactToClient.bind(null, locale, contactId);

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
      <ChatWindow
        locale={locale}
        contact={{
          id: contact.id,
          displayName: contact.displayName,
          pictureUrl: contact.pictureUrl,
          clientId: contact.clientId,
          clientName: contact.client
            ? `${contact.client.firstName} ${contact.client.lastName}`
            : null,
        }}
        messages={contact.messages.map((m) => ({
          id: m.id,
          direction: m.direction,
          messageType: m.messageType,
          text: m.text,
          mediaPath: m.mediaPath,
          createdAt: m.createdAt.toISOString(),
        }))}
        clients={clients.map((c) => ({
          id: c.id,
          label: `${c.firstName} ${c.lastName}`,
        }))}
        sendAction={sendAction}
        linkAction={linkAction}
      />
    </div>
  );
}
