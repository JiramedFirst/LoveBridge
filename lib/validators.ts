import { z } from "zod";

export const clientSchema = z.object({
  firstName: z.string().min(1, "required"),
  lastName: z.string().min(1, "required"),
  nationalId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  partnerFirstName: z.string().optional().nullable(),
  partnerLastName: z.string().optional().nullable(),
  partnerPassportNo: z.string().optional().nullable(),
  partnerNationality: z.string().optional().nullable(),
  partnerDateOfBirth: z.string().optional().nullable(),
  partnerOccupation: z.string().optional().nullable(),
  partnerCountryOfResidence: z.string().optional().nullable(),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const caseSchema = z.object({
  clientId: z.string().min(1),
  visaType: z.enum([
    "SPOUSE_US",
    "SPOUSE_UK",
    "SPOUSE_AU",
    "SPOUSE_DE",
    "FIANCE_US",
    "OTHER",
  ]),
  destinationCountry: z.string().min(1),
  targetSubmitDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export type CaseInput = z.infer<typeof caseSchema>;

export const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export const invoiceSchema = z.object({
  caseId: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  items: z.array(invoiceItemSchema).min(1),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "TRANSFER", "CARD"]),
  reference: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
