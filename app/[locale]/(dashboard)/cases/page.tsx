import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { CaseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/cases/StatusBadge";
import { CaseBoard } from "@/components/cases/CaseBoard";
import { formatDate } from "@/lib/utils";

const STATUS_ORDER: CaseStatus[] = [
  "LEAD",
  "DOCUMENT_COLLECTION",
  "SUBMITTED",
  "INTERVIEW",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("cases");

  const cases = await prisma.visaCase.findMany({
    include: {
      client: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { openedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button asChild>
          <Link href={`/${locale}/cases/new`}>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">{t("board")}</TabsTrigger>
          <TabsTrigger value="list">{t("list")}</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <CaseBoard
            locale={locale}
            statuses={STATUS_ORDER}
            cases={cases.map((c) => ({
              id: c.id,
              caseNumber: c.caseNumber,
              clientName: `${c.client.firstName} ${c.client.lastName}`,
              visaType: c.visaType,
              destinationCountry: c.destinationCountry,
              status: c.status,
              assignedTo: c.assignedTo?.name ?? null,
              targetSubmitDate: c.targetSubmitDate?.toISOString() ?? null,
            }))}
          />
        </TabsContent>
        <TabsContent value="list">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("caseNumber")}</TableHead>
                  <TableHead>{t("client")}</TableHead>
                  <TableHead>{t("visaType")}</TableHead>
                  <TableHead>{t("destination")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("targetSubmitDate")}</TableHead>
                  <TableHead>{t("assignedTo")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/${locale}/cases/${c.id}`} className="font-medium hover:underline">
                        {c.caseNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {c.client.firstName} {c.client.lastName}
                    </TableCell>
                    <TableCell>{t(`visaTypes.${c.visaType}`)}</TableCell>
                    <TableCell>{c.destinationCountry}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      {formatDate(c.targetSubmitDate, locale === "th" ? "th-TH" : "en-US")}
                    </TableCell>
                    <TableCell>{c.assignedTo?.name ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
