// Para indicadores de impacto
export type PolicyImpact = "low" | "medium" | "high";

export interface PolicyFieldMetadata {
  label: string;
  description: string;
  impact: PolicyImpact;
  impactMessage: string;
  requiresRestart?: boolean;
}
