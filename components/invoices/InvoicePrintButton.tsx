"use client";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function InvoicePrintButton() {
  const t = useTranslations("common");
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      {t("print")}
    </Button>
  );
}
