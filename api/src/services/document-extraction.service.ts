import path from 'path';
import { PDFParse } from 'pdf-parse';

export type DocumentExtractionStatus = 'processed' | 'empty' | 'error';

export interface DocumentExtractionResult {
  text: string;
  status: DocumentExtractionStatus;
  warning?: string;
}

const normalizeText = (value: string): string =>
  value.replace(/\u0000/g, '').replace(/\r/g, '').trim();

const extractCsvText = (buffer: Buffer): string => {
  const rawText = buffer.toString('utf8');
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return normalizeText(lines.join('\n'));
};

export const extractTextFromFile = async (
  file: Express.Multer.File,
): Promise<DocumentExtractionResult> => {
  const extension = path.extname(file.originalname).toLowerCase();

  try {
    switch (extension) {
      case '.pdf': {
        const pdfData = await new PDFParse({ data: file.buffer }).getText();
        const text = normalizeText(pdfData.text ?? '');

        if (!text) {
          return {
            text: '',
            status: 'empty',
            warning: 'No readable text was found in the PDF.',
          };
        }

        return { text, status: 'processed' };
      }

      case '.txt': {
        const text = normalizeText(file.buffer.toString('utf8'));

        if (!text) {
          return {
            text: '',
            status: 'empty',
            warning: 'No readable text was found in the TXT file.',
          };
        }

        return { text, status: 'processed' };
      }

      case '.csv': {
        const text = extractCsvText(file.buffer);

        if (!text) {
          return {
            text: '',
            status: 'empty',
            warning: 'No readable rows were found in the CSV file.',
          };
        }

        return { text, status: 'processed' };
      }

      default:
        return {
          text: '',
          status: 'error',
          warning: 'Unsupported document type.',
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to extract text from the file.';

    return {
      text: '',
      status: 'error',
      warning: message,
    };
  }
};
