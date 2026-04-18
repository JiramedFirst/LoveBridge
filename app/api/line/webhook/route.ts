import { NextRequest, NextResponse } from "next/server";
import type { LineMessageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySignature, getProfile, fetchMessageContent } from "@/lib/line";
import { saveFile } from "@/lib/storage";

type LineEvent = {
  type: string;
  replyToken?: string;
  timestamp: number;
  source: { type: string; userId?: string };
  message?: {
    id: string;
    type: string;
    text?: string;
    packageId?: string;
    stickerId?: string;
  };
};

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const sig = req.headers.get("x-line-signature");

  if (!verifySignature(bodyText, sig)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(bodyText) as { events: LineEvent[] };

  for (const event of body.events ?? []) {
    if (!event.source.userId) continue;

    const contact = await upsertContact(event.source.userId);

    if (event.type === "message" && event.message) {
      await handleMessage(contact.id, event.message);
    } else if (event.type === "follow") {
      // user added us as a friend — already upserted, nothing else
    } else if (event.type === "unfollow") {
      // keep the record for history
    }
  }

  return NextResponse.json({ ok: true });
}

async function upsertContact(lineUserId: string) {
  const existing = await prisma.lineContact.findUnique({
    where: { lineUserId },
  });
  if (existing) return existing;

  let displayName = lineUserId;
  let pictureUrl: string | undefined;
  try {
    const profile = await getProfile(lineUserId);
    displayName = profile.displayName;
    pictureUrl = profile.pictureUrl;
  } catch {
    // profile fetch can fail silently
  }

  return prisma.lineContact.create({
    data: { lineUserId, displayName, pictureUrl },
  });
}

async function handleMessage(
  contactId: string,
  m: { id: string; type: string; text?: string },
) {
  const mapped = mapMessageType(m.type);
  let mediaPath: string | null = null;
  let text: string | null = m.text ?? null;

  if (["image", "video", "audio", "file"].includes(m.type)) {
    try {
      const { buffer, contentType } = await fetchMessageContent(m.id);
      const ext = extFromContentType(contentType) ?? "bin";
      const saved = await saveFile(
        `line/${contactId}`,
        `${m.id}.${ext}`,
        buffer,
      );
      mediaPath = saved.relativePath;
    } catch (e) {
      console.error("LINE media fetch failed", e);
    }
  } else if (m.type === "sticker") {
    text = "[sticker]";
  } else if (m.type === "location") {
    text = "[location]";
  }

  await prisma.$transaction([
    prisma.lineMessage.create({
      data: {
        lineContactId: contactId,
        direction: "INBOUND",
        messageType: mapped,
        text,
        mediaPath,
        lineMessageId: m.id,
      },
    }),
    prisma.lineContact.update({
      where: { id: contactId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    }),
  ]);
}

function mapMessageType(t: string): LineMessageType {
  switch (t) {
    case "text":
      return "TEXT";
    case "image":
      return "IMAGE";
    case "video":
      return "VIDEO";
    case "audio":
      return "AUDIO";
    case "file":
      return "FILE";
    case "sticker":
      return "STICKER";
    case "location":
      return "LOCATION";
    default:
      return "OTHER";
  }
}

function extFromContentType(ct: string): string | null {
  const [main] = ct.split(";").map((s) => s.trim());
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "application/pdf": "pdf",
  };
  return map[main] ?? null;
}
