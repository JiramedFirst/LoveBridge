import type { DocumentType, OwnerSide, VisaType } from "@prisma/client";

export type RequirementItem = {
  type: DocumentType;
  ownerSide: OwnerSide;
  labelKey: string;
};

const COMMON: RequirementItem[] = [
  { type: "PASSPORT", ownerSide: "CLIENT", labelKey: "docs.passport.client" },
  { type: "PASSPORT", ownerSide: "PARTNER", labelKey: "docs.passport.partner" },
  { type: "ID_CARD", ownerSide: "CLIENT", labelKey: "docs.idCard" },
  { type: "HOUSE_REG", ownerSide: "CLIENT", labelKey: "docs.houseReg" },
  { type: "MARRIAGE_CERT", ownerSide: "JOINT", labelKey: "docs.marriageCert" },
  { type: "RELATIONSHIP_PROOF", ownerSide: "JOINT", labelKey: "docs.relationshipProof" },
  { type: "PHOTO", ownerSide: "JOINT", labelKey: "docs.photos" },
  { type: "FINANCIAL_PROOF", ownerSide: "PARTNER", labelKey: "docs.financialProof" },
];

const BY_TYPE: Record<VisaType, RequirementItem[]> = {
  SPOUSE_US: [...COMMON, { type: "EMBASSY_FORM", ownerSide: "CLIENT", labelKey: "docs.ds260" }],
  SPOUSE_UK: [...COMMON, { type: "EMBASSY_FORM", ownerSide: "CLIENT", labelKey: "docs.vaf4a" }],
  SPOUSE_AU: [...COMMON, { type: "EMBASSY_FORM", ownerSide: "CLIENT", labelKey: "docs.form47sp" }],
  SPOUSE_DE: [...COMMON, { type: "EMBASSY_FORM", ownerSide: "CLIENT", labelKey: "docs.germanForm" }],
  FIANCE_US: [
    { type: "PASSPORT", ownerSide: "CLIENT", labelKey: "docs.passport.client" },
    { type: "PASSPORT", ownerSide: "PARTNER", labelKey: "docs.passport.partner" },
    { type: "ID_CARD", ownerSide: "CLIENT", labelKey: "docs.idCard" },
    { type: "BIRTH_CERT", ownerSide: "CLIENT", labelKey: "docs.birthCert" },
    { type: "RELATIONSHIP_PROOF", ownerSide: "JOINT", labelKey: "docs.relationshipProof" },
    { type: "PHOTO", ownerSide: "JOINT", labelKey: "docs.photos" },
    { type: "FINANCIAL_PROOF", ownerSide: "PARTNER", labelKey: "docs.financialProof" },
    { type: "EMBASSY_FORM", ownerSide: "CLIENT", labelKey: "docs.ds160" },
  ],
  OTHER: COMMON,
};

export function getRequirements(visaType: VisaType): RequirementItem[] {
  return BY_TYPE[visaType] ?? COMMON;
}
