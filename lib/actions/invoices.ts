"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { invoiceSchema, paymentSchema } from "@/lib/validators";
import { nextInvoiceNumber } from "@/lib/case-numbers";

export async function createInvoice(locale: string, fd: FormData) {
  const user = await requireUser();
  const raw = fd.get("payload");
  if (typeof raw !== "string") throw new Error("invalid payload");
  const parsed = invoiceSchema.parse(JSON.parse(raw));

  const subtotal = parsed.items.reduce(
    (s, it) => s + Number(it.quantity) * Number(it.unitPrice),
    0,
  );
  const tax = subtotal * (parsed.taxRate / 100);
  const total = subtotal + tax;
  const invoiceNumber = await nextInvoiceNumber();

  const created = await prisma.invoice.create({
    data: {
      invoiceNumber,
      caseId: parsed.caseId,
      dueDate: new Date(parsed.dueDate),
      notes: parsed.notes ?? null,
      subtotal,
      tax,
      total,
      items: {
        create: parsed.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          amount: Number(it.quantity) * Number(it.unitPrice),
        })),
      },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseId: parsed.caseId,
      userId: user.id,
      type: "PAYMENT",
      message: `Invoice ${invoiceNumber} created (${total.toFixed(2)} THB)`,
    },
  });

  revalidatePath(`/${locale}/invoices`);
  revalidatePath(`/${locale}/cases/${parsed.caseId}`);
  redirect(`/${locale}/invoices/${created.id}`);
}

export async function recordPayment(locale: string, fd: FormData) {
  const user = await requireUser();
  const input = paymentSchema.parse({
    invoiceId: String(fd.get("invoiceId") ?? ""),
    amount: fd.get("amount"),
    method: fd.get("method"),
    reference: fd.get("reference"),
    paidAt: fd.get("paidAt"),
  });

  await prisma.payment.create({
    data: {
      invoiceId: input.invoiceId,
      amount: input.amount,
      method: input.method as PaymentMethod,
      reference: input.reference || null,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      recordedById: user.id,
    },
  });

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("invoice not found");
  const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const total = Number(invoice.total);
  if (paid >= total) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID" },
    });
  }

  await prisma.caseActivity.create({
    data: {
      caseId: invoice.caseId,
      userId: user.id,
      type: "PAYMENT",
      message: `Payment recorded: ${Number(input.amount).toFixed(2)} (${input.method})`,
    },
  });

  revalidatePath(`/${locale}/invoices/${invoice.id}`);
  revalidatePath(`/${locale}/invoices`);
  revalidatePath(`/${locale}/cases/${invoice.caseId}`);
}

export async function markInvoiceSent(locale: string, invoiceId: string) {
  await requireUser();
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "SENT" },
  });
  revalidatePath(`/${locale}/invoices/${invoiceId}`);
  revalidatePath(`/${locale}/invoices`);
}
