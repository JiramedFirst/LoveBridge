"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VISA_TYPES = ["SPOUSE_US", "SPOUSE_UK", "SPOUSE_AU", "SPOUSE_DE", "FIANCE_US", "OTHER"] as const;

export function NewCaseForm({
  action,
  clients,
  staff,
  defaultClientId,
}: {
  action: (fd: FormData) => Promise<void>;
  clients: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  defaultClientId?: string;
}) {
  const t = useTranslations("cases");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, start] = useTransition();

  function submit(fd: FormData) {
    start(async () => {
      try {
        await action(fd);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "error");
      }
    });
  }

  return (
    <form action={submit}>
      <Card>
        <CardHeader>
          <CardTitle>{t("new")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="clientId">{t("client")}</Label>
            <select
              id="clientId"
              name="clientId"
              required
              defaultValue={defaultClientId ?? ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="visaType">{t("visaType")}</Label>
            <select
              id="visaType"
              name="visaType"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {VISA_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`visaTypes.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="destinationCountry">{t("destination")}</Label>
            <Input id="destinationCountry" name="destinationCountry" required />
          </div>

          <div>
            <Label htmlFor="targetSubmitDate">{t("targetSubmitDate")}</Label>
            <Input id="targetSubmitDate" name="targetSubmitDate" type="date" />
          </div>

          <div>
            <Label htmlFor="assignedToId">{t("assignedTo")}</Label>
            <select
              id="assignedToId"
              name="assignedToId"
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {tc("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
