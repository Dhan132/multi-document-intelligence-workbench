import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import path from 'path';

import { config } from '../config';
import { insertDocument, listDocuments } from '../db/database';
import { validateFile } from '../middleware/upload-validation';
import { extractTextFromFile } from '../services/document-extraction.service';
import type { UploadedDocumentResponse } from '../types/document';

export const uploadDocuments = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files were uploaded.',
    });
  }

  const uploadedDocuments: UploadedDocumentResponse[] = [];

  for (const file of files) {
    const validationError = validateFile(file);

    if (validationError) {
      uploadedDocuments.push({
        id: randomUUID(),
        filename: file.originalname,
        fileType: path.extname(file.originalname).toLowerCase(),
        sizeBytes: file.size,
        extractedTextLength: 0,
        status: 'rejected',
        warning: validationError,
      });
      continue;
    }

    const extractionResult = await extractTextFromFile(file);
    const documentId = randomUUID();
    const fileType = path.extname(file.originalname).toLowerCase();
    const storageStatus = extractionResult.status === 'processed' ? 'ready' : 'error';

    insertDocument({
      id: documentId,
      filename: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      extension: fileType,
      sizeBytes: file.size,
      extractedTextLength: extractionResult.text.length,
      status: storageStatus,
      extractedText: extractionResult.status === 'processed' ? extractionResult.text : undefined,
    });

    uploadedDocuments.push({
      id: documentId,
      filename: file.originalname,
      fileType,
      sizeBytes: file.size,
      extractedTextLength: extractionResult.text.length,
      status: storageStatus,
      ...(extractionResult.warning ? { warning: extractionResult.warning } : {}),
    });
  }

  return res.status(200).json({
    success: true,
    documents: uploadedDocuments,
    limit: config.maxFilesPerRequest,
  });
};

export const listStoredDocuments = (_req: Request, res: Response) => {
  const documents = listDocuments();

  return res.status(200).json({
    success: true,
    documents: documents.map((document) => ({
      id: document.id,
      filename: document.filename,
      mimeType: document.mimeType,
      extension: document.extension,
      sizeBytes: document.sizeBytes,
      extractedTextLength: document.extractedTextLength,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })),
  });
};
