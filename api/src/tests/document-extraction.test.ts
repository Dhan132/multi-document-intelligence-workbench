import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { extractTextFromFile } from '../services/document-extraction.service';

describe('Document extraction', () => {
  it('extracts text from a TXT file', async () => {
    const file = {
      originalname: 'summary.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('Status: Active\nOwner: Operations Team\nRisk Level: Moderate'),
    } as Express.Multer.File;

    const result = await extractTextFromFile(file);

    assert.equal(result.status, 'processed');
    assert.match(result.text, /Status: Active/i);
    assert.match(result.text, /Owner: Operations Team/i);
  });

  it('extracts rows from a CSV file', async () => {
    const file = {
      originalname: 'metrics.csv',
      mimetype: 'text/csv',
      buffer: Buffer.from('Document,Status,Owner\nAlpha,On Track,Ops Team\nBeta,Delayed,Finance Team'),
    } as Express.Multer.File;

    const result = await extractTextFromFile(file);

    assert.equal(result.status, 'processed');
    assert.match(result.text, /Document,Status,Owner/i);
    assert.match(result.text, /Alpha,On Track,Ops Team/i);
  });
});
