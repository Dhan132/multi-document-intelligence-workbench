export interface EvidenceSource {
  documentId: string;
  filename: string;
  evidence: string;
}

export interface KeyFinding {
  claim: string;
  type: 'extracted_fact' | 'inferred_summary' | 'comparison';
  confidence: 'low' | 'medium' | 'high';
  sources: EvidenceSource[];
}

export interface ComparisonItem {
  label: string;
  values: Array<{
    documentId: string;
    filename: string;
    value: string;
  }>;
  note: string;
}

export interface DiscrepancyItem {
  label: string;
  description: string;
  sources: EvidenceSource[];
}

export interface MissingInformationItem {
  field: string;
  reason: string;
  sources: EvidenceSource[];
}

export interface KeyValueItem {
  key: string;
  value: string;
  sources: EvidenceSource[];
}

export interface InterpretationItem {
  statement: string;
  sources: EvidenceSource[];
}

export interface AnalysisResult {
  summary: string;
  keyFindings: KeyFinding[];
  comparisons: ComparisonItem[];
  discrepancies: DiscrepancyItem[];
  missingInformation: MissingInformationItem[];
  keyValues: KeyValueItem[];
  interpretations: InterpretationItem[];
  limitations: string[];
}

export interface AnalysisResponse {
  success: boolean;
  analysis: AnalysisResult;
}
