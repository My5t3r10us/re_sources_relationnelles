export const REPORT_REASON_LABELS: Record<string, string> = {
  harassment: "Harcèlement",
  spam: "Spam",
  misinformation: "Désinformation",
  inappropriate: "Inapproprié",
  other: "Autre",
};

export const REPORT_REASON_VALUES = [
  "harassment",
  "spam",
  "misinformation",
  "inappropriate",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASON_VALUES)[number];

export const REPORT_TARGET_VALUES = ["resource", "comment"] as const;
export type ReportTarget = (typeof REPORT_TARGET_VALUES)[number];
