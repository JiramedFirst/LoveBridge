"use server";

import { revalidatePath } from "next/cache";
import type { DocumentType, OwnerSide } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveFile, deleteFile } from "@/lib/storage";

export async function uploadDocuments(locale: string, caseId: string, fd: FormData) {
  const user = await requireUser();
  const type = String(fd.get("type") ?? "OTHER") as DocumentType;
  const ownerSide = String(fd.get("ownerSide") ?? "CLIENT") as OwnerSide;
  const files = fd.getAll("files") as File[];

  if (files.length === 0) return;

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { relativePath } = await saveFile(`cases/${caseId}`, file.name, buffer);

    await prisma.document.create({
      data: {
        caseId,
        type,
        ownerSide,
        fileName: file.name,
        filePath: relativePath,
        mimeType: file.type || "application/octet-stream",
        fileSize: buffer.byteLength,
        uploadedById: user.id,
      },
    });

    await prisma.caseActivity.create({
      data: {
        caseId,
        userId: user.id,
        type: "DOC_UPLOADED",
        message: `Uploaded ${file.name}`,
      },
    });
  }

  revalidatePath(`/${locale}/cases/${caseId}`);
}

export async function toggleDocumentVerified(locale: string, caseId: string, docId: string) {
  await requireUser();
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) return;
  await prisma.document.update({
    where: { id: docId },
    data: { verified: !doc.verified },
  });
  revalidatePath(`/${locale}/cases/${caseId}`);
}

export async function removeDocument(locale: string, caseId: string, docId: string) {
  await requireUser();
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) return;
  await deleteFile(doc.filePath);
  await prisma.document.delete({ where: { id: docId } });
  revalidatePath(`/${locale}/cases/${caseId}`);
}
