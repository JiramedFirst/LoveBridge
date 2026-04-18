"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

type Item = { id: string; description: string; quantity: number; unitPrice: number };

export function InvoiceForm({
  action,
  cases,
  defaultCaseId,
}: {
  action: (fd: FormData) => Promise<void>;
  cases: { id: string; label: string }[];
  defaultCaseId?: string;
}) {
  const t = useTranslations("invoices");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [caseId, setCaseId] = useState(defaultCaseId ?? "");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0),
    [items],
  );
  const tax = useMemo(() => subtotal * (Number(taxRate) / 100), [subtotal, taxRate]);
  const total = subtotal + tax;

  function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function submit() {
    if (!caseId) {
      toast.error(t("case"));
      return;
    }
    const payload = {
      caseId,
      dueDate,
      notes: notes || null,
      taxRate: Number(taxRate),
      items: items
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
    };
    if (payload.items.length === 0) {
      toast.error(t("items"));
      return;
    }
    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    start(async () => {
      try {
        await action(fd);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "error");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("new")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>{t("case")}</Label>
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t("dueDate")}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label>{t("taxRate")}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>{t("notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{t("items")}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              {t("addItem")}
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="grid gap-2 md:grid-cols-12 items-end">
                <div className="md:col-span-6">
                  <Input
                    placeholder={t("description")}
                    value={it.description}
                    onChange={(e) => update(it.id, { description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t("quantity")}
                    value={it.quantity}
                    onChange={(e) => update(it.id, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t("unitPrice")}
                    value={it.unitPrice}
                    onChange={(e) => update(it.id, { unitPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-1 text-right font-mono text-sm">
                  {formatMoney(Number(it.quantity) * Number(it.unitPrice))}
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span className="font-mono">{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("tax")}</span>
            <span className="font-mono">{formatMoney(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>{t("total")}</span>
            <span className="font-mono">{formatMoney(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {tc("cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {tc("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
