import { getTranslations } from "next-intl/server";
import { Briefcase, AlertCircle, Wallet, UserPlus, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatMoney } from "@/lib/utils";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");

  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [openCases, upcoming, outstandingInvoices, newThisMonth, unread, recent] = await Promise.all(
    [
      prisma.visaCase.count({
        where: { status: { notIn: ["APPROVED", "REJECTED", "CLOSED"] } },
      }),
      prisma.visaCase.count({
        where: {
          status: { notIn: ["APPROVED", "REJECTED", "CLOSED"] },
          targetSubmitDate: { gte: now, lte: in14 },
        },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["SENT", "OVERDUE"] } },
        include: { payments: true },
      }),
      prisma.visaCase.count({ where: { openedAt: { gte: startOfMonth } } }),
      prisma.lineContact.aggregate({ _sum: { unreadCount: true } }),
      prisma.caseActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          case: { select: { caseNumber: true } },
          user: { select: { name: true } },
        },
      }),
    ],
  );

  const outstanding = outstandingInvoices.reduce((sum, inv) => {
    const paid = inv.payments.reduce((p, pay) => p + Number(pay.amount), 0);
    return sum + Math.max(0, Number(inv.total) - paid);
  }, 0);

  const stats = [
    { icon: Briefcase, label: t("openCases"), value: openCases },
    { icon: AlertCircle, label: t("upcomingDeadlines"), value: upcoming },
    { icon: Wallet, label: t("outstandingTotal"), value: formatMoney(outstanding) },
    { icon: UserPlus, label: t("newThisMonth"), value: newThisMonth },
    { icon: MessageCircle, label: t("unreadChats"), value: unread._sum.unreadCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y">
              {recent.map((a) => (
                <li key={a.id} className="py-2 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {a.case.caseNumber} · {a.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.user?.name ?? "system"} · {formatDateTime(a.createdAt, locale === "th" ? "th-TH" : "en-US")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
