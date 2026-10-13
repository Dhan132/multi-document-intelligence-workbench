export interface UploadDocumentResponse {
  id: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  extractedTextLength: number;
  status: 'ready' | 'error' | 'rejected';
  warning?: string;
}

export interface AnalysisSource {
  documentId: string;
  filename: string;
  evidence: string;
}

export interface KeyFinding {
  claim: string;
  type: string;
  confidence?: string;
  sources: AnalysisSource[];
}

export interface ComparisonItem {
  label: string;
  values: Array<{ documentId: string; filename: string; value: string }>;
  note: string;
}

export interface DiscrepancyItem {
  label: string;
  description: string;
  sources: AnalysisSource[];
}

export interface MissingInformationItem {
  field: string;
  reason: string;
  sources: AnalysisSource[];
}

export interface KeyValueItem {
  key: string;
  value: string;
  sources: AnalysisSource[];
}

export interface InterpretationItem {
  statement: string;
  sources: AnalysisSource[];
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
  message?: string;
}
