import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("invoices");

  const invoices = await prisma.invoice.findMany({
    include: {
      payments: true,
      case: { include: { client: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { issueDate: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button asChild>
          <Link href={`/${locale}/invoices/new`}>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invoiceNumber")}</TableHead>
              <TableHead>{t("case")}</TableHead>
              <TableHead>{t("issueDate")}</TableHead>
              <TableHead>{t("dueDate")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
              <TableHead className="text-right">{t("balance")}</TableHead>
              <TableHead>{t("invoiceNumber")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
              const balance = Number(inv.total) - paid;
              return (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/${locale}/invoices/${inv.id}`} className="font-medium hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/${locale}/cases/${inv.caseId}`} className="hover:underline">
                      {inv.case.caseNumber} · {inv.case.client.firstName} {inv.case.client.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(inv.issueDate, locale === "th" ? "th-TH" : "en-US")}</TableCell>
                  <TableCell>{formatDate(inv.dueDate, locale === "th" ? "th-TH" : "en-US")}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(Number(inv.total))}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(balance)}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
