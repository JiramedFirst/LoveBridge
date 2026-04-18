"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CaseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { caseSchema } from "@/lib/validators";
import { nextCaseNumber } from "@/lib/case-numbers";

function norm(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function createCase(locale: string, fd: FormData) {
  const user = await requireUser();
  const input = caseSchema.parse({
    clientId: String(fd.get("clientId") ?? ""),
    visaType: String(fd.get("visaType") ?? ""),
    destinationCountry: String(fd.get("destinationCountry") ?? ""),
    targetSubmitDate: norm(fd.get("targetSubmitDate")),
    assignedToId: norm(fd.get("assignedToId")),
  });

  const caseNumber = await nextCaseNumber();
  const created = await prisma.visaCase.create({
    data: {
      caseNumber,
      clientId: input.clientId,
      visaType: input.visaType,
      destinationCountry: input.destinationCountry,
      targetSubmitDate: input.targetSubmitDate ? new Date(input.targetSubmitDate) : null,
      assignedToId: input.assignedToId || null,
      activities: {
        create: {
          userId: user.id,
          type: "NOTE",
          message: `Case created by ${user.name ?? user.email}`,
        },
      },
    },
  });

  revalidatePath(`/${locale}/cases`);
  redirect(`/${locale}/cases/${created.id}`);
}

export async function updateCaseStatus(
  locale: string,
  id: string,
  status: CaseStatus,
) {
  const user = await requireUser();
  const current = await prisma.visaCase.findUnique({ where: { id } });
  if (!current) throw new Error("not found");
  if (current.status === status) return;

  await prisma.$transaction([
    prisma.visaCase.update({
      where: { id },
      data: {
        status,
        closedAt: status === "CLOSED" || status === "APPROVED" || status === "REJECTED" ? new Date() : null,
      },
    }),
    prisma.caseActivity.create({
      data: {
        caseId: id,
        userId: user.id,
        type: "STATUS_CHANGE",
        message: `Status changed: ${current.status} → ${status}`,
      },
    }),
  ]);

  revalidatePath(`/${locale}/cases`);
  revalidatePath(`/${locale}/cases/${id}`);
}

export async function addCaseNote(locale: string, caseId: string, fd: FormData) {
  const user = await requireUser();
  const message = String(fd.get("message") ?? "").trim();
  if (!message) return;

  await prisma.caseActivity.create({
    data: {
      caseId,
      userId: user.id,
      type: "NOTE",
      message,
    },
  });
  revalidatePath(`/${locale}/cases/${caseId}`);
}
