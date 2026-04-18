"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markInvoiceSent } from "@/lib/actions/invoices";

export function MarkSentButton({
  locale,
  invoiceId,
}: {
  locale: string;
  invoiceId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await markInvoiceSent(locale, invoiceId);
            toast.success("Sent");
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "error");
          }
        })
      }
    >
      <Send className="h-4 w-4" />
      Send
    </Button>
  );
}
