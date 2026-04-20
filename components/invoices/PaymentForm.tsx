"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const METHODS = ["CASH", "TRANSFER", "CARD"] as const;

export function PaymentForm({
  invoiceId,
  defaultAmount,
  action,
}: {
  invoiceId: string;
  defaultAmount: number;
  action: (fd: FormData) => Promise<void>;
}) {
  const t = useTranslations("invoices");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    start(async () => {
      try {
        await action(fd);
        toast.success(tc("save"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "error");
      }
    });
  }

  return (
    <form action={submit} className="grid gap-3 md:grid-cols-5 items-end border-t pt-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <Label>Amount</Label>
        <Input type="number" name="amount" min="0.01" step="0.01" defaultValue={defaultAmount} required />
      </div>
      <div>
        <Label>{t("paymentMethod")}</Label>
        <select
          name="method"
          defaultValue="TRANSFER"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {t(`methods.${m}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>{t("reference")}</Label>
        <Input name="reference" />
      </div>
      <div>
        <Label>{t("paidAt")}</Label>
        <Input type="date" name="paidAt" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <Button type="submit" disabled={pending}>
        {t("recordPayment")}
      </Button>
    </form>
  );
}
