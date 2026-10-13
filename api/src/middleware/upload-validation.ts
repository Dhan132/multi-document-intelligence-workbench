import multer, { type FileFilterCallback } from 'multer';
import path from 'path';

import { config } from '../config';

const allowedExtensions = new Set(['.pdf', '.txt', '.csv']);
const allowedMimeTypes: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain', 'application/octet-stream'],
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'],
};

const maxFileSizeBytes = config.maxFileSizeMb * 1024 * 1024;

export const validateFile = (file: Express.Multer.File): string | null => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return 'Unsupported file type. Only PDF, TXT, and CSV are allowed.';
  }

  if (file.size <= 0) {
    return 'File is empty.';
  }

  if (file.size > maxFileSizeBytes) {
    return `File exceeds the ${config.maxFileSizeMb} MB size limit.`;
  }

  const validMimeTypes = allowedMimeTypes[extension] ?? [];
  if (validMimeTypes.length > 0 && !validMimeTypes.includes(mimeType)) {
    return 'File extension and MIME type do not match the supported document formats.';
  }

  return null;
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeBytes,
    files: config.maxFilesPerRequest,
  },
  fileFilter: (_req, file, callback: FileFilterCallback) => {
    const validationError = validateFile(file);

    if (validationError) {
      callback(new Error(validationError));
      return;
    }

    callback(null, true);
  },
});
