"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageSquare, FileText, Wallet, RefreshCw, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

type Activity = {
  id: string;
  type: "NOTE" | "STATUS_CHANGE" | "DOC_UPLOADED" | "PAYMENT" | "LINE_MESSAGE";
  message: string;
  userName: string | null;
  createdAt: string;
};

const iconFor = {
  NOTE: MessageSquare,
  STATUS_CHANGE: RefreshCw,
  DOC_UPLOADED: FileText,
  PAYMENT: Wallet,
  LINE_MESSAGE: MessageCircle,
} as const;

export function CaseTimeline({
  activities,
  addNoteAction,
  locale,
}: {
  activities: Activity[];
  addNoteAction: (fd: FormData) => Promise<void>;
  locale: string;
}) {
  const t = useTranslations("cases");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement | null>(null);

  function submit(fd: FormData) {
    const msg = String(fd.get("message") ?? "").trim();
    if (!msg) return;
    start(async () => {
      try {
        await addNoteAction(fd);
        ref.current?.reset();
        toast.success(tc("save"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <form ref={ref} action={submit} className="space-y-2">
            <Textarea name="message" placeholder={t("addNote")} rows={2} />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={pending}>
                {tc("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground">{tc("noData")}</p>
        )}
        {activities.map((a) => {
          const Icon = iconFor[a.type];
          return (
            <div key={a.id} className="flex gap-3">
              <div className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 rounded-md border bg-card p-3">
                <div className="text-sm whitespace-pre-wrap">{a.message}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {a.userName ?? "system"} · {formatDateTime(a.createdAt, locale === "th" ? "th-TH" : "en-US")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
