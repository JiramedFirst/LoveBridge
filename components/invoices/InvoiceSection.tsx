"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/utils";

type Inv = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  total: number;
  paid: number;
};

export function InvoiceSection({
  locale,
  caseId,
  invoices,
}: {
  locale: string;
  caseId: string;
  invoices: Inv[];
}) {
  const t = useTranslations("invoices");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{t("title")}</CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link href={`/${locale}/invoices/new?caseId=${caseId}`}>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {invoices.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/${locale}/invoices/${inv.id}`}
            className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-accent"
          >
            <div>
              <div className="font-medium">{inv.invoiceNumber}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(inv.issueDate, locale === "th" ? "th-TH" : "en-US")} → {formatDate(inv.dueDate, locale === "th" ? "th-TH" : "en-US")}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono">{formatMoney(inv.total)}</div>
              <Badge
                variant={
                  inv.status === "PAID"
                    ? "success"
                    : inv.status === "OVERDUE"
                    ? "destructive"
                    : inv.status === "SENT"
                    ? "info"
                    : "secondary"
                }
              >
                {t(`statuses.${inv.status}`)}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
