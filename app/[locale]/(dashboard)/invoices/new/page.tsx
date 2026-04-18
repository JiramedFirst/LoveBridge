import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { createInvoice } from "@/lib/actions/invoices";

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ caseId?: string }>;
}) {
  const { locale } = await params;
  const { caseId } = await searchParams;

  const cases = await prisma.visaCase.findMany({
    include: { client: { select: { firstName: true, lastName: true } } },
    orderBy: { openedAt: "desc" },
    take: 200,
  });

  const bound = createInvoice.bind(null, locale);

  return (
    <div className="max-w-4xl space-y-4">
      <InvoiceForm
        action={bound}
        cases={cases.map((c) => ({
          id: c.id,
          label: `${c.caseNumber} · ${c.client.firstName} ${c.client.lastName}`,
        }))}
        defaultCaseId={caseId}
      />
    </div>
  );
}
