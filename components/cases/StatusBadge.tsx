"use client";
import { useTranslations } from "next-intl";
import type { CaseStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const variantFor: Record<CaseStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "info"> = {
  LEAD: "secondary",
  DOCUMENT_COLLECTION: "info",
  SUBMITTED: "default",
  INTERVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CLOSED: "secondary",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const t = useTranslations("cases.statuses");
  return <Badge variant={variantFor[status]}>{t(status)}</Badge>;
}
