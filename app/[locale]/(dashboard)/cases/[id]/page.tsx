import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/cases/StatusBadge";
import { CaseTimeline } from "@/components/cases/CaseTimeline";
import { CaseStatusControl } from "@/components/cases/CaseStatusControl";
import { DocumentSection } from "@/components/documents/DocumentSection";
import { InvoiceSection } from "@/components/invoices/InvoiceSection";
import { addCaseNote } from "@/lib/actions/cases";
import { formatDate } from "@/lib/utils";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("cases");
  const tc = await getTranslations("common");

  const [kase, staff, documents, invoices] = await Promise.all([
    prisma.visaCase.findUnique({
      where: { id },
      include: {
        client: { include: { partner: true } },
        assignedTo: { select: { id: true, name: true } },
        activities: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.document.findMany({
      where: { caseId: id },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { caseId: id },
      include: { payments: true, items: true },
      orderBy: { issueDate: "desc" },
    }),
  ]);

  if (!kase) notFound();

  const addNote = addCaseNote.bind(null, locale, id);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            {kase.caseNumber}
            <StatusBadge status={kase.status} />
          </h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/${locale}/clients/${kase.clientId}`} className="hover:underline">
              {kase.client.firstName} {kase.client.lastName}
            </Link>
            {kase.client.partner && (
              <> — {kase.client.partner.firstName} {kase.client.partner.lastName}</>
            )}
          </p>
        </div>
        <CaseStatusControl locale={locale} caseId={id} status={kase.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">{t("visaType")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">{t(`visaTypes.${kase.visaType}`)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">{t("destination")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">{kase.destinationCountry}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">{t("targetSubmitDate")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {formatDate(kase.targetSubmitDate, locale === "th" ? "th-TH" : "en-US")}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">{t("timeline")}</TabsTrigger>
          <TabsTrigger value="documents">{tc("documents")}</TabsTrigger>
          <TabsTrigger value="invoices">{tc("invoices")}</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <CaseTimeline
            activities={kase.activities.map((a) => ({
              id: a.id,
              type: a.type,
              message: a.message,
              userName: a.user?.name ?? null,
              createdAt: a.createdAt.toISOString(),
            }))}
            addNoteAction={addNote}
            locale={locale}
          />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentSection
            locale={locale}
            caseId={id}
            visaType={kase.visaType}
            documents={documents.map((d) => ({
              id: d.id,
              type: d.type,
              ownerSide: d.ownerSide,
              fileName: d.fileName,
              filePath: d.filePath,
              mimeType: d.mimeType,
              fileSize: d.fileSize,
              verified: d.verified,
              uploadedByName: d.uploadedBy?.name ?? null,
              uploadedAt: d.uploadedAt.toISOString(),
            }))}
          />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoiceSection
            locale={locale}
            caseId={id}
            invoices={invoices.map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              issueDate: inv.issueDate.toISOString(),
              dueDate: inv.dueDate.toISOString(),
              status: inv.status,
              total: Number(inv.total),
              paid: inv.payments.reduce((s, p) => s + Number(p.amount), 0),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
