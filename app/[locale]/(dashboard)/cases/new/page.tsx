import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { NewCaseForm } from "@/components/cases/NewCaseForm";
import { createCase } from "@/lib/actions/cases";

export default async function NewCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { locale } = await params;
  const { clientId } = await searchParams;
  const t = await getTranslations("cases");

  const [clients, staff] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const bound = createCase.bind(null, locale);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <NewCaseForm
        action={bound}
        clients={clients.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))}
        staff={staff}
        defaultClientId={clientId}
      />
    </div>
  );
}
