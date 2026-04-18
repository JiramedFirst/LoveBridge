import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Briefcase, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientForm } from "@/components/clients/ClientForm";
import { updateClient } from "@/lib/actions/clients";
import { formatDate } from "@/lib/utils";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("clients");
  const tCases = await getTranslations("cases");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      partner: true,
      cases: {
        orderBy: { openedAt: "desc" },
      },
      lineContacts: true,
    },
  });

  if (!client) notFound();

  const staff = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const bound = updateClient.bind(null, locale, id);

  const dob = client.dateOfBirth ? client.dateOfBirth.toISOString().slice(0, 10) : "";
  const partnerDob = client.partner?.dateOfBirth
    ? client.partner.dateOfBirth.toISOString().slice(0, 10)
    : "";

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {client.firstName} {client.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">{t("detailTitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {t("cases")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {client.cases.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {client.cases.map((c) => (
            <Link
              key={c.id}
              href={`/${locale}/cases/${c.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="font-medium">{c.caseNumber}</div>
                <div className="text-xs text-muted-foreground">
                  {tCases(`visaTypes.${c.visaType}`)} · {c.destinationCountry}
                </div>
              </div>
              <Badge variant="secondary">{tCases(`statuses.${c.status}`)}</Badge>
            </Link>
          ))}
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/cases/new?clientId=${client.id}`}>+ {tCases("new")}</Link>
          </Button>
        </CardContent>
      </Card>

      {client.lineContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              LINE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.lineContacts.map((lc) => (
              <Link
                key={lc.id}
                href={`/${locale}/chat/${lc.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
              >
                <span>{lc.displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(lc.lastMessageAt, locale === "th" ? "th-TH" : "en-US")}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <ClientForm
        staff={staff}
        action={bound}
        initial={{
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          nationalId: client.nationalId,
          phone: client.phone,
          email: client.email,
          address: client.address,
          dateOfBirth: dob,
          notes: client.notes,
          assignedToId: client.assignedToId,
          partnerFirstName: client.partner?.firstName ?? "",
          partnerLastName: client.partner?.lastName ?? "",
          partnerPassportNo: client.partner?.passportNo ?? "",
          partnerNationality: client.partner?.nationality ?? "",
          partnerDateOfBirth: partnerDob,
          partnerOccupation: client.partner?.occupation ?? "",
          partnerCountryOfResidence: client.partner?.countryOfResidence ?? "",
        }}
      />
    </div>
  );
}
