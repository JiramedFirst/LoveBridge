"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { DocumentType, OwnerSide, VisaType } from "@prisma/client";
import { Upload, Check, X, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequirements } from "@/lib/visa-requirements";
import { uploadDocuments, toggleDocumentVerified, removeDocument } from "@/lib/actions/documents";
import { formatDateTime } from "@/lib/utils";

type Doc = {
  id: string;
  type: DocumentType;
  ownerSide: OwnerSide;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  verified: boolean;
  uploadedByName: string | null;
  uploadedAt: string;
};

const TYPES: DocumentType[] = [
  "PASSPORT",
  "ID_CARD",
  "HOUSE_REG",
  "MARRIAGE_CERT",
  "BIRTH_CERT",
  "FINANCIAL_PROOF",
  "RELATIONSHIP_PROOF",
  "PHOTO",
  "EMBASSY_FORM",
  "OTHER",
];

const OWNERS: OwnerSide[] = ["CLIENT", "PARTNER", "JOINT"];

export function DocumentSection({
  locale,
  caseId,
  visaType,
  documents,
}: {
  locale: string;
  caseId: string;
  visaType: VisaType;
  documents: Doc[];
}) {
  const t = useTranslations("documents");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [type, setType] = useState<DocumentType>("PASSPORT");
  const [ownerSide, setOwnerSide] = useState<OwnerSide>("CLIENT");

  function onUpload(fd: FormData) {
    start(async () => {
      try {
        await uploadDocuments(locale, caseId, fd);
        formRef.current?.reset();
        toast.success(tc("upload"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "error");
      }
    });
  }

  const required = getRequirements(visaType);
  const presentKey = (type: DocumentType, side: OwnerSide) =>
    documents.some((d) => d.type === type && d.ownerSide === side);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("checklist")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2">
            {required.map((r) => {
              const present = presentKey(r.type, r.ownerSide);
              return (
                <li
                  key={`${r.type}-${r.ownerSide}`}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                    present ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <span>
                    {t(`types.${r.type}`)} — {t(`owners.${r.ownerSide}`)}
                  </span>
                  <Badge variant={present ? "success" : "warning"}>
                    {present ? t("present") : t("missing")}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tc("upload")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={onUpload} className="grid gap-3 md:grid-cols-4">
            <div>
              <Label>{t("type")}</Label>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TYPES.map((v) => (
                  <option key={v} value={v}>
                    {t(`types.${v}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t("ownerSide")}</Label>
              <select
                name="ownerSide"
                value={ownerSide}
                onChange={(e) => setOwnerSide(e.target.value as OwnerSide)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {OWNERS.map((v) => (
                  <option key={v} value={v}>
                    {t(`owners.${v}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>{t("fileName")}</Label>
              <input
                type="file"
                name="files"
                multiple
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
                required
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={pending}>
                <Upload className="h-4 w-4" />
                {tc("upload")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 && <p className="text-sm text-muted-foreground">{tc("noData")}</p>}
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{d.fileName}</span>
                  {d.verified && <Badge variant="success">{t("verified")}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t(`types.${d.type}`)} · {t(`owners.${d.ownerSide}`)} · {Math.round(d.fileSize / 1024)} KB ·{" "}
                  {formatDateTime(d.uploadedAt, locale === "th" ? "th-TH" : "en-US")}
                  {d.uploadedByName ? ` · ${d.uploadedByName}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="sm">
                  <a href={`/api/uploads/${d.filePath}`} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await toggleDocumentVerified(locale, caseId, d.id);
                      router.refresh();
                    })
                  }
                >
                  {d.verified ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await removeDocument(locale, caseId, d.id);
                      router.refresh();
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
