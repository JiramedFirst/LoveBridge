"use client";
import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CaseStatus, VisaType } from "@prisma/client";
import { toast } from "sonner";
import { updateCaseStatus } from "@/lib/actions/cases";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  caseNumber: string;
  clientName: string;
  visaType: VisaType;
  destinationCountry: string;
  status: CaseStatus;
  assignedTo: string | null;
  targetSubmitDate: string | null;
};

export function CaseBoard({
  locale,
  statuses,
  cases,
}: {
  locale: string;
  statuses: CaseStatus[];
  cases: Item[];
}) {
  const t = useTranslations("cases");
  const router = useRouter();
  const [, start] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);

  const grouped: Record<CaseStatus, Item[]> = Object.fromEntries(
    statuses.map((s) => [s, cases.filter((c) => c.status === s)]),
  ) as Record<CaseStatus, Item[]>;

  function onDrop(status: CaseStatus, e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/case-id");
    setDragging(null);
    if (!id) return;
    const item = cases.find((c) => c.id === id);
    if (!item || item.status === status) return;
    start(async () => {
      try {
        await updateCaseStatus(locale, id, status);
        toast.success(`${item.caseNumber} → ${t(`statuses.${status}`)}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "error");
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {statuses.map((s) => (
        <div
          key={s}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(s, e)}
          className={cn(
            "min-w-[240px] w-64 shrink-0 rounded-lg border bg-card",
            dragging ? "outline outline-2 outline-dashed outline-muted-foreground/30" : "",
          )}
        >
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <span className="text-sm font-semibold">{t(`statuses.${s}`)}</span>
            <span className="text-xs text-muted-foreground">{grouped[s].length}</span>
          </div>
          <div className="p-2 space-y-2 min-h-[160px]">
            {grouped[s].map((c) => (
              <Link
                key={c.id}
                href={`/${locale}/cases/${c.id}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/case-id", c.id);
                  setDragging(c.id);
                }}
                onDragEnd={() => setDragging(null)}
                className="block rounded-md border bg-background p-3 shadow-sm hover:border-primary"
              >
                <div className="text-xs font-mono text-muted-foreground">{c.caseNumber}</div>
                <div className="font-medium text-sm truncate">{c.clientName}</div>
                <div className="text-xs text-muted-foreground">
                  {t(`visaTypes.${c.visaType}`)}
                </div>
                {c.assignedTo && (
                  <div className="mt-1 text-xs text-muted-foreground">👤 {c.assignedTo}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
