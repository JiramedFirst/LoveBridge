import crypto from "crypto";

const LINE_API = "https://api.line.me/v2/bot";
const LINE_DATA_API = "https://api-data.line.me/v2/bot";

function channelSecret(): string {
  const s = process.env.LINE_CHANNEL_SECRET;
  if (!s) throw new Error("LINE_CHANNEL_SECRET is not configured");
  return s;
}

function accessToken(): string {
  const t = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!t) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
  return t;
}

export function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const mac = crypto
    .createHmac("sha256", channelSecret())
    .update(body)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

export async function getProfile(userId: string): Promise<LineProfile> {
  const res = await fetch(`${LINE_API}/profile/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!res.ok) throw new Error(`LINE getProfile failed: ${res.status}`);
  return res.json();
}

export async function replyMessage(replyToken: string, text: string): Promise<void> {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
  if (!res.ok) throw new Error(`LINE reply failed: ${res.status} ${await res.text()}`);
}

export async function pushMessage(to: string, text: string): Promise<void> {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  });
  if (!res.ok) throw new Error(`LINE push failed: ${res.status} ${await res.text()}`);
}

export async function fetchMessageContent(messageId: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const res = await fetch(`${LINE_DATA_API}/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!res.ok) throw new Error(`LINE content failed: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}
