import { prisma } from "@/lib/prisma";
import { ClientForm } from "@/components/clients/ClientForm";
import { createClient } from "@/lib/actions/clients";

export default async function NewClientPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const staff = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const bound = createClient.bind(null, locale);

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">New Client</h1>
      <ClientForm staff={staff} action={bound} />
    </div>
  );
}
