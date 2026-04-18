import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoicePrintButton } from "@/components/invoices/InvoicePrintButton";
import { PaymentForm } from "@/components/invoices/PaymentForm";
import { MarkSentButton } from "@/components/invoices/MarkSentButton";
import { recordPayment } from "@/lib/actions/invoices";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("invoices");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { include: { recordedBy: { select: { name: true } } }, orderBy: { paidAt: "desc" } },
      case: {
        include: {
          client: { include: { partner: true } },
        },
      },
    },
  });
  if (!invoice) notFound();

  const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(invoice.total) - paid;

  const paymentAction = recordPayment.bind(null, locale);

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between no-print gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
        <div className="flex gap-2">
          {invoice.status === "DRAFT" && <MarkSentButton locale={locale} invoiceId={id} />}
          <InvoicePrintButton />
        </div>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6" id="invoice-print">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold text-primary">LoveBridge</div>
              <div className="text-sm text-muted-foreground">{t("title")}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{invoice.invoiceNumber}</div>
              <Badge
                variant={
                  invoice.status === "PAID"
                    ? "success"
                    : invoice.status === "OVERDUE"
                    ? "destructive"
                    : invoice.status === "SENT"
                    ? "info"
                    : "secondary"
                }
              >
                {t(`statuses.${invoice.status}`)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div className="text-muted-foreground">{t("case")}</div>
              <Link href={`/${locale}/cases/${invoice.caseId}`} className="font-medium hover:underline">
                {invoice.case.caseNumber}
              </Link>
              <div>
                {invoice.case.client.firstName} {invoice.case.client.lastName}
              </div>
              {invoice.case.client.partner && (
                <div className="text-muted-foreground">
                  & {invoice.case.client.partner.firstName} {invoice.case.client.partner.lastName}
                </div>
              )}
            </div>
            <div className="md:text-right">
              <div>
                <span className="text-muted-foreground">{t("issueDate")}:</span>{" "}
                {formatDate(invoice.issueDate, locale === "th" ? "th-TH" : "en-US")}
              </div>
              <div>
                <span className="text-muted-foreground">{t("dueDate")}:</span>{" "}
                {formatDate(invoice.dueDate, locale === "th" ? "th-TH" : "en-US")}
              </div>
            </div>
          </div>

          <table className="w-full text-sm border-t">
            <thead>
              <tr className="text-left">
                <th className="py-2">{t("description")}</th>
                <th className="py-2 text-right">{t("quantity")}</th>
                <th className="py-2 text-right">{t("unitPrice")}</th>
                <th className="py-2 text-right">{t("amount")}</th>
              </tr>
            </thead>
            <tbody className="border-t">
              {invoice.items.map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right font-mono">{Number(it.quantity)}</td>
                  <td className="py-2 text-right font-mono">{formatMoney(Number(it.unitPrice))}</td>
                  <td className="py-2 text-right font-mono">{formatMoney(Number(it.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span className="font-mono">{formatMoney(Number(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("tax")}</span>
              <span className="font-mono">{formatMoney(Number(invoice.tax))}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-1">
              <span>{t("total")}</span>
              <span className="font-mono">{formatMoney(Number(invoice.total))}</span>
            </div>
            <div className="flex justify-between text-sm text-primary font-semibold">
              <span>{t("balance")}</span>
              <span className="font-mono">{formatMoney(balance)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="text-sm border-t pt-3">
              <div className="text-muted-foreground mb-1">{t("notes")}</div>
              <div className="whitespace-pre-wrap">{invoice.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>{t("payments")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y">
              {invoice.payments.map((p) => (
                <li key={p.id} className="py-2 flex justify-between text-sm">
                  <div>
                    <span className="font-mono">{formatMoney(Number(p.amount))}</span>
                    <span className="text-muted-foreground ml-2">
                      {t(`methods.${p.method}`)}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(p.paidAt, locale === "th" ? "th-TH" : "en-US")}
                    {p.recordedBy?.name ? ` · ${p.recordedBy.name}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {balance > 0 && (
            <PaymentForm
              invoiceId={id}
              defaultAmount={balance}
              action={paymentAction}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
