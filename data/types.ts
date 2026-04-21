export type CompanyType = "Emerging biotech" | "Small biotech" | "Mid-size pharma" | "Large pharma";

export type TherapeuticArea =
  | "Oncology"
  | "Immunology & Inflammatory"
  | "Cardiovascular & Metabolic"
  | "Neurology & CNS"
  | "All / Other";

export type RoleFocus =
  | "Patient Services"
  | "Market Access"
  | "Field Access"
  | "Commercial Ops / IT"
  | "Executive";

export interface ResponseData {
  core: string;
}

export type ResponsesMap = Record<CompanyType, Record<string, ResponseData>>;

export interface OverlayQuestionData {
  ta?: Partial<Record<TherapeuticArea, string>>;
  role?: Partial<Record<RoleFocus, string>>;
}

export type OverlaysMap = Partial<Record<CompanyType, Record<string, OverlayQuestionData>>>;

export type QuestionsMap = Record<CompanyType, string[]>;

export type OpeningMap = Record<CompanyType, string>;
