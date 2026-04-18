"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CaseStatus } from "@prisma/client";
import { toast } from "sonner";
import { updateCaseStatus } from "@/lib/actions/cases";

const STATUSES: CaseStatus[] = [
  "LEAD",
  "DOCUMENT_COLLECTION",
  "SUBMITTED",
  "INTERVIEW",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

export function CaseStatusControl({
  locale,
  caseId,
  status,
}: {
  locale: string;
  caseId: string;
  status: CaseStatus;
}) {
  const t = useTranslations("cases");
  const router = useRouter();
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CaseStatus;
    start(async () => {
      try {
        await updateCaseStatus(locale, caseId, next);
        toast.success(t(`statuses.${next}`));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "error");
      }
    });
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`statuses.${s}`)}
        </option>
      ))}
    </select>
  );
}
