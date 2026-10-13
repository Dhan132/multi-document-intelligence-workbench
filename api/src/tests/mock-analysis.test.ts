import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { db, initializeDatabase, insertDocument } from '../db/database';
import { runMockAnalysis } from '../services/mock-analyzer.service';

const testDocumentIds: string[] = [];

afterEach(() => {
  for (const documentId of testDocumentIds) {
    db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
  }
  testDocumentIds.length = 0;
});

describe('Mock analysis', () => {
  it('returns structured findings with source provenance', async () => {
    initializeDatabase();

    const documentA = 'doc-analysis-a';
    const documentB = 'doc-analysis-b';
    testDocumentIds.push(documentA, documentB);

    insertDocument({
      id: documentA,
      filename: 'alpha.txt',
      mimeType: 'text/plain',
      extension: '.txt',
      sizeBytes: 500,
      extractedTextLength: 120,
      status: 'ready',
      extractedText: 'Status: Active\nOwner: Ops Team\nRisk Level: Moderate',
    });

    insertDocument({
      id: documentB,
      filename: 'beta.txt',
      mimeType: 'text/plain',
      extension: '.txt',
      sizeBytes: 500,
      extractedTextLength: 120,
      status: 'ready',
      extractedText: 'Status: Delayed\nOwner: Finance Team\nRisk Level: High',
    });

    const response = await runMockAnalysis([documentA, documentB], 'Compare status and risk across the documents.');

    assert.equal(response.success, true);
    assert.equal(typeof response.analysis.summary, 'string');
    assert.ok(response.analysis.keyFindings.length > 0);
    assert.ok(response.analysis.comparisons.length >= 0);
    assert.ok(response.analysis.keyValues.length > 0);

    const hasSourceProvenance = response.analysis.keyFindings.some((finding) =>
      finding.sources.some((source) => source.documentId === documentA || source.documentId === documentB),
    );

    assert.equal(hasSourceProvenance, true);
  });
});
