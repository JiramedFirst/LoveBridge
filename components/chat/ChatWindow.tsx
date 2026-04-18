"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send, Link as LinkIcon, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDateTime } from "@/lib/utils";

type MessageType = "TEXT" | "IMAGE" | "FILE" | "STICKER" | "LOCATION" | "VIDEO" | "AUDIO" | "OTHER";
type Direction = "INBOUND" | "OUTBOUND";

type Message = {
  id: string;
  direction: Direction;
  messageType: MessageType;
  text: string | null;
  mediaPath: string | null;
  createdAt: string;
};

export function ChatWindow({
  locale,
  contact,
  messages,
  clients,
  sendAction,
  linkAction,
}: {
  locale: string;
  contact: {
    id: string;
    displayName: string;
    pictureUrl: string | null;
    clientId: string | null;
    clientName: string | null;
  };
  messages: Message[];
  clients: { id: string; label: string }[];
  sendAction: (fd: FormData) => Promise<void>;
  linkAction: (clientId: string | null) => Promise<void>;
}) {
  const t = useTranslations("chat");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 7000);
    return () => clearInterval(timer);
  }, [router]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.append("text", trimmed);
    start(async () => {
      try {
        await sendAction(fd);
        setText("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "error");
      }
    });
  }

  function onLinkChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    start(async () => {
      try {
        await linkAction(value);
        toast.success(value ? t("linked") : t("unlink"));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "error");
      }
    });
  }

  return (
    <div className="flex flex-col rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-3 border-b p-3">
        {contact.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contact.pictureUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-primary/20 text-primary grid place-items-center text-sm font-semibold">
            {contact.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{contact.displayName}</div>
          {contact.clientName ? (
            <Link
              href={`/${locale}/clients/${contact.clientId}`}
              className="text-xs text-primary hover:underline"
            >
              🔗 {contact.clientName}
            </Link>
          ) : (
            <div className="text-xs text-muted-foreground">—</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={contact.clientId ?? ""}
            onChange={onLinkChange}
            disabled={pending}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">— {t("linkToClient")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {contact.clientId ? (
            <Unlink className="h-4 w-4 text-muted-foreground" />
          ) : (
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-muted/30">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">{t("noMessages")}</div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.direction === "OUTBOUND" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                m.direction === "OUTBOUND"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border",
              )}
            >
              {m.messageType === "IMAGE" && m.mediaPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/uploads/${m.mediaPath}`}
                  alt=""
                  className="max-w-xs rounded-md"
                />
              ) : m.messageType === "STICKER" ? (
                <span>{t("stickerMessage")}</span>
              ) : m.messageType === "LOCATION" ? (
                <span>{t("locationMessage")}</span>
              ) : m.messageType !== "TEXT" && m.mediaPath ? (
                <a
                  href={`/api/uploads/${m.mediaPath}`}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("mediaMessage")}
                </a>
              ) : (
                <span className="whitespace-pre-wrap">{m.text ?? ""}</span>
              )}
              <div
                className={cn(
                  "mt-1 text-[10px]",
                  m.direction === "OUTBOUND" ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {formatDateTime(m.createdAt, locale === "th" ? "th-TH" : "en-US")}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("messagePlaceholder")}
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !text.trim()}>
          <Send className="h-4 w-4" />
          {t("send")}
        </Button>
      </form>
    </div>
  );
}
