import type { AnalysisResponse, AnalysisResult, ComparisonItem, DiscrepancyItem, EvidenceSource, InterpretationItem, KeyFinding, KeyValueItem, MissingInformationItem } from '../types/analysis';
import { getDocumentById } from '../db/database';

interface DocumentBundle {
  id: string;
  filename: string;
  mimeType: string;
  extractedText: string;
}

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const extractKeyValuePairs = (text: string) => {
  const segments = text.split(/\n|\.|;|\|/);
  const matches: Array<{ key: string; value: string; evidence: string }> = [];

  for (const segment of segments) {
    const match = segment.match(/([A-Za-z][A-Za-z0-9\s\-/]{2,40})\s*[:=]\s*([^,;\n]+)/i);
    if (!match) continue;

    const key = normalizeText(match[1]).replace(/\s+/g, ' ');
    const value = normalizeText(match[2]);

    if (key && value && value.length < 200) {
      matches.push({ key, value, evidence: normalizeText(segment) });
    }
  }

  return matches;
};

const extractEvidenceSnippet = (text: string): string => {
  const trimmed = normalizeText(text);
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
};

const collectDocumentEvidence = (document: DocumentBundle): EvidenceSource[] => [
  {
    documentId: document.id,
    filename: document.filename,
    evidence: extractEvidenceSnippet(document.extractedText.slice(0, 400)),
  },
];

const findComparisonPairs = (documents: DocumentBundle[]) => {
  const map = new Map<string, Array<{ documentId: string; filename: string; value: string }>>();

  for (const document of documents) {
    const pairs = extractKeyValuePairs(document.extractedText);
    for (const pair of pairs) {
      const key = pair.key.toLowerCase();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push({
        documentId: document.id,
        filename: document.filename,
        value: pair.value,
      });
    }
  }

  const comparisons: ComparisonItem[] = [];

  for (const [label, values] of map.entries()) {
    const uniqueValues = Array.from(new Set(values.map((entry) => entry.value.toLowerCase())));

    if (uniqueValues.length > 1 && values.length > 1) {
      comparisons.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        values: values.map((entry) => ({
          documentId: entry.documentId,
          filename: entry.filename,
          value: entry.value,
        })),
        note: 'Values differ across documents and may indicate a discrepancy or context difference.',
      });
    }
  }

  return comparisons;
};

const findDiscrepancies = (documents: DocumentBundle[]): DiscrepancyItem[] => {
  const comparisons = findComparisonPairs(documents);

  return comparisons.map((comparison) => ({
    label: comparison.label,
    description: `Different values were found for ${comparison.label.toLowerCase()} across the uploaded documents.`,
    sources: comparison.values.map((value) => ({
      documentId: value.documentId,
      filename: value.filename,
      evidence: `Reported value: ${value.value}`,
    })),
  }));
};

const findMissingInformation = (documents: DocumentBundle[], prompt: string): MissingInformationItem[] => {
  const lowerPrompt = prompt.toLowerCase();
  const extractedKeys = new Set<string>();

  for (const document of documents) {
    for (const pair of extractKeyValuePairs(document.extractedText)) {
      extractedKeys.add(pair.key.toLowerCase());
    }
  }

  const candidateFields = ['status', 'owner', 'date', 'amount', 'cost', 'total', 'risk', 'priority', 'summary'];
  const missing: MissingInformationItem[] = [];

  for (const field of candidateFields) {
    const fieldFound = Array.from(extractedKeys).some((key) => key.includes(field));
    const promptReferencesField = lowerPrompt.includes(field);

    if (promptReferencesField && !fieldFound) {
      missing.push({
        field,
        reason: `The prompt requested information about ${field}, but no matching field was found in the uploaded documents.`,
        sources: documents.map((document) => ({
          documentId: document.id,
          filename: document.filename,
          evidence: `Document-level review of ${document.filename} did not reveal a ${field} field.`,
        })),
      });
    }
  }

  return missing;
};

const createKeyValues = (documents: DocumentBundle[]): KeyValueItem[] => {
  const items: KeyValueItem[] = [];

  for (const document of documents) {
    const pairs = extractKeyValuePairs(document.extractedText);
    for (const pair of pairs.slice(0, 6)) {
      items.push({
        key: pair.key,
        value: pair.value,
        sources: [
          {
            documentId: document.id,
            filename: document.filename,
            evidence: pair.evidence,
          },
        ],
      });
    }
  }

  return items;
};

const buildSummary = (documents: DocumentBundle[], prompt: string): string => {
  const documentNames = documents.map((document) => document.filename).join(', ');
  const preview = documents
    .map((document) => normalizeText(document.extractedText.slice(0, 220)))
    .filter(Boolean)
    .join(' ');

  const summaryText = preview || 'No extracted content was available for review.';

  return `Rule-based analysis reviewed ${documents.length} document(s): ${documentNames}. The prompt asked for: "${prompt.slice(0, 180)}${prompt.length > 180 ? '...' : ''}". Based on the extracted text, the combined material suggests a summary of the most relevant items and notable differences in values or statuses across the set. This is a mock, rule-based result and should be treated as heuristic evidence rather than a verified fact.`;
};

const buildKeyFindings = (documents: DocumentBundle[]): KeyFinding[] => {
  const findings: KeyFinding[] = [];

  for (const document of documents) {
    const pairs = extractKeyValuePairs(document.extractedText);

    for (const pair of pairs.slice(0, 4)) {
      findings.push({
        claim: `${pair.key} is recorded as ${pair.value}.`,
        type: 'extracted_fact',
        confidence: 'medium',
        sources: [
          {
            documentId: document.id,
            filename: document.filename,
            evidence: pair.evidence,
          },
        ],
      });
    }
  }

  return findings;
};

const buildInterpretations = (documents: DocumentBundle[]): InterpretationItem[] => {
  const comparisonPairs = findComparisonPairs(documents);
  const interpretations: InterpretationItem[] = [];

  for (const item of comparisonPairs.slice(0, 3)) {
    interpretations.push({
      statement: `The values reported for ${item.label.toLowerCase()} vary across the uploaded documents, which may indicate a difference in timing, context, or source accuracy.`,
      sources: item.values.map((value) => ({
        documentId: value.documentId,
        filename: value.filename,
        evidence: `Value reported: ${value.value}`,
      })),
    });
  }

  if (interpretations.length === 0) {
    interpretations.push({
      statement: 'No direct cross-document conflicts were detected from the extracted values in the uploaded files.',
      sources: documents.flatMap((document) => collectDocumentEvidence(document)),
    });
  }

  return interpretations;
};

export const runMockAnalysis = async (
  documentIds: string[],
  prompt: string,
): Promise<AnalysisResponse> => {
  const documents: DocumentBundle[] = [];

  for (const documentId of documentIds) {
    const documentRecord = getDocumentById(documentId) as Record<string, unknown> | undefined;

    if (!documentRecord || !documentRecord.extractedText || typeof documentRecord.extractedText !== 'string') {
      continue;
    }

    documents.push({
      id: String(documentRecord.id),
      filename: String(documentRecord.filename),
      mimeType: String(documentRecord.mimeType),
      extractedText: String(documentRecord.extractedText),
    });
  }

  if (documents.length === 0) {
    return {
      success: false,
      analysis: {
        summary: 'No valid documents were available for analysis.',
        keyFindings: [],
        comparisons: [],
        discrepancies: [],
        missingInformation: [],
        keyValues: [],
        interpretations: [],
        limitations: ['No uploaded documents were available to analyze.'],
      },
    };
  }

  const analysis: AnalysisResult = {
    summary: buildSummary(documents, prompt),
    keyFindings: buildKeyFindings(documents),
    comparisons: findComparisonPairs(documents),
    discrepancies: findDiscrepancies(documents),
    missingInformation: findMissingInformation(documents, prompt),
    keyValues: createKeyValues(documents),
    interpretations: buildInterpretations(documents),
    limitations: [
      'This result is generated by a rule-based mock analyzer and is not a verified AI conclusion.',
      'Evidence is limited to document-level provenance because page-level references were not present in the extracted text.',
      'Any inferred relationship should be validated against the original source documents before making a decision.',
    ],
  };

  return { success: true, analysis };
};
