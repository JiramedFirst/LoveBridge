"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { pushMessage } from "@/lib/line";

export async function sendLineMessage(
  locale: string,
  contactId: string,
  fd: FormData,
) {
  const user = await requireUser();
  const text = String(fd.get("text") ?? "").trim();
  if (!text) return;

  const contact = await prisma.lineContact.findUnique({ where: { id: contactId } });
  if (!contact) throw new Error("not found");

  await pushMessage(contact.lineUserId, text);

  await prisma.lineMessage.create({
    data: {
      lineContactId: contactId,
      direction: "OUTBOUND",
      messageType: "TEXT",
      text,
      sentById: user.id,
    },
  });

  await prisma.lineContact.update({
    where: { id: contactId },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath(`/${locale}/chat/${contactId}`);
  revalidatePath(`/${locale}/chat`);
}

export async function linkContactToClient(
  locale: string,
  contactId: string,
  clientId: string | null,
) {
  await requireUser();
  await prisma.lineContact.update({
    where: { id: contactId },
    data: { clientId },
  });
  revalidatePath(`/${locale}/chat/${contactId}`);
  revalidatePath(`/${locale}/chat`);
}

export async function markContactRead(locale: string, contactId: string) {
  await requireUser();
  const now = new Date();
  await prisma.$transaction([
    prisma.lineContact.update({
      where: { id: contactId },
      data: { unreadCount: 0 },
    }),
    prisma.lineMessage.updateMany({
      where: { lineContactId: contactId, direction: "INBOUND", readAt: null },
      data: { readAt: now },
    }),
  ]);
  revalidatePath(`/${locale}/chat`);
}
