import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { config } from '../config';
import { validateFile } from '../middleware/upload-validation';

describe('Upload validation', () => {
  it('accepts a valid TXT file', () => {
    const file = {
      originalname: 'report.txt',
      mimetype: 'text/plain',
      size: 1024,
    } as Express.Multer.File;

    assert.equal(validateFile(file), null);
  });

  it('rejects unsupported file types', () => {
    const file = {
      originalname: 'report.exe',
      mimetype: 'application/x-msdownload',
      size: 1024,
    } as Express.Multer.File;

    assert.match(validateFile(file) ?? '', /Unsupported file type/i);
  });

  it('rejects files larger than the configured limit', () => {
    const file = {
      originalname: 'large.csv',
      mimetype: 'text/csv',
      size: (config.maxFileSizeMb * 1024 * 1024) + 1,
    } as Express.Multer.File;

    assert.match(validateFile(file) ?? '', /exceeds the/i);
  });
});
