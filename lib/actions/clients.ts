"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clientSchema, type ClientInput } from "@/lib/validators";

function normalize(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fromFormData(fd: FormData): ClientInput {
  return {
    firstName: String(fd.get("firstName") ?? ""),
    lastName: String(fd.get("lastName") ?? ""),
    nationalId: normalize(fd.get("nationalId")),
    phone: normalize(fd.get("phone")),
    email: normalize(fd.get("email")) ?? "",
    address: normalize(fd.get("address")),
    dateOfBirth: normalize(fd.get("dateOfBirth")),
    notes: normalize(fd.get("notes")),
    assignedToId: normalize(fd.get("assignedToId")),
    partnerFirstName: normalize(fd.get("partnerFirstName")),
    partnerLastName: normalize(fd.get("partnerLastName")),
    partnerPassportNo: normalize(fd.get("partnerPassportNo")),
    partnerNationality: normalize(fd.get("partnerNationality")),
    partnerDateOfBirth: normalize(fd.get("partnerDateOfBirth")),
    partnerOccupation: normalize(fd.get("partnerOccupation")),
    partnerCountryOfResidence: normalize(fd.get("partnerCountryOfResidence")),
  };
}

export async function createClient(locale: string, fd: FormData) {
  await requireUser();
  const input = clientSchema.parse(fromFormData(fd));

  const client = await prisma.client.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      nationalId: input.nationalId,
      phone: input.phone,
      email: input.email || null,
      address: input.address,
      dateOfBirth: parseDate(input.dateOfBirth ?? null),
      notes: input.notes,
      assignedToId: input.assignedToId || null,
      partner:
        input.partnerFirstName || input.partnerLastName
          ? {
              create: {
                firstName: input.partnerFirstName ?? "",
                lastName: input.partnerLastName ?? "",
                passportNo: input.partnerPassportNo,
                nationality: input.partnerNationality,
                dateOfBirth: parseDate(input.partnerDateOfBirth ?? null),
                occupation: input.partnerOccupation,
                countryOfResidence: input.partnerCountryOfResidence,
              },
            }
          : undefined,
    },
  });

  revalidatePath(`/${locale}/clients`);
  redirect(`/${locale}/clients/${client.id}`);
}

export async function updateClient(locale: string, id: string, fd: FormData) {
  await requireUser();
  const input = clientSchema.parse(fromFormData(fd));

  await prisma.client.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      nationalId: input.nationalId,
      phone: input.phone,
      email: input.email || null,
      address: input.address,
      dateOfBirth: parseDate(input.dateOfBirth ?? null),
      notes: input.notes,
      assignedToId: input.assignedToId || null,
      partner: {
        upsert: {
          update: {
            firstName: input.partnerFirstName ?? "",
            lastName: input.partnerLastName ?? "",
            passportNo: input.partnerPassportNo,
            nationality: input.partnerNationality,
            dateOfBirth: parseDate(input.partnerDateOfBirth ?? null),
            occupation: input.partnerOccupation,
            countryOfResidence: input.partnerCountryOfResidence,
          },
          create: {
            firstName: input.partnerFirstName ?? "",
            lastName: input.partnerLastName ?? "",
            passportNo: input.partnerPassportNo,
            nationality: input.partnerNationality,
            dateOfBirth: parseDate(input.partnerDateOfBirth ?? null),
            occupation: input.partnerOccupation,
            countryOfResidence: input.partnerCountryOfResidence,
          },
        },
      },
    },
  });

  revalidatePath(`/${locale}/clients/${id}`);
  revalidatePath(`/${locale}/clients`);
}

export async function deleteClient(locale: string, id: string) {
  await requireUser();
  await prisma.client.delete({ where: { id } });
  revalidatePath(`/${locale}/clients`);
  redirect(`/${locale}/clients`);
}
