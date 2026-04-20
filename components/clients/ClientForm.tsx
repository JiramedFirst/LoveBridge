"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Staff = { id: string; name: string };

type InitialValues = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  nationalId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  partnerFirstName?: string | null;
  partnerLastName?: string | null;
  partnerPassportNo?: string | null;
  partnerNationality?: string | null;
  partnerDateOfBirth?: string | null;
  partnerOccupation?: string | null;
  partnerCountryOfResidence?: string | null;
};

export function ClientForm({
  initial,
  staff,
  action,
}: {
  initial?: InitialValues;
  staff: Staff[];
  action: (fd: FormData) => Promise<void>;
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, start] = useTransition();

  function submit(fd: FormData) {
    start(async () => {
      try {
        await action(fd);
        toast.success(tc("save"));
        router.refresh();
      } catch (e) {
        const err = e instanceof Error ? e.message : "error";
        toast.error(err);
      }
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("detailTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t("firstName")} name="firstName" defaultValue={initial?.firstName ?? ""} required />
          <Field label={t("lastName")} name="lastName" defaultValue={initial?.lastName ?? ""} required />
          <Field label={t("nationalId")} name="nationalId" defaultValue={initial?.nationalId ?? ""} />
          <Field label={t("phone")} name="phone" defaultValue={initial?.phone ?? ""} />
          <Field label={t("email")} name="email" type="email" defaultValue={initial?.email ?? ""} />
          <Field
            label={t("dateOfBirth")}
            name="dateOfBirth"
            type="date"
            defaultValue={initial?.dateOfBirth ?? ""}
          />
          <div className="md:col-span-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Textarea id="address" name="address" defaultValue={initial?.address ?? ""} />
          </div>
          <div>
            <Label htmlFor="assignedToId">{t("assignedTo")}</Label>
            <select
              id="assignedToId"
              name="assignedToId"
              defaultValue={initial?.assignedToId ?? ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("partner")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t("partnerFirstName")} name="partnerFirstName" defaultValue={initial?.partnerFirstName ?? ""} />
          <Field label={t("partnerLastName")} name="partnerLastName" defaultValue={initial?.partnerLastName ?? ""} />
          <Field label={t("partnerPassportNo")} name="partnerPassportNo" defaultValue={initial?.partnerPassportNo ?? ""} />
          <Field label={t("partnerNationality")} name="partnerNationality" defaultValue={initial?.partnerNationality ?? ""} />
          <Field
            label={t("partnerDateOfBirth")}
            name="partnerDateOfBirth"
            type="date"
            defaultValue={initial?.partnerDateOfBirth ?? ""}
          />
          <Field label={t("partnerOccupation")} name="partnerOccupation" defaultValue={initial?.partnerOccupation ?? ""} />
          <Field label={t("partnerCountry")} name="partnerCountryOfResidence" defaultValue={initial?.partnerCountryOfResidence ?? ""} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}
