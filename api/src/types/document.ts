export type DocumentStatus = 'ready' | 'error' | 'queued' | 'rejected';

export interface DocumentRecord {
  id: string;
  filename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  extractedTextLength: number;
  status: DocumentStatus;
  extractedText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadedDocumentResponse {
  id: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  extractedTextLength: number;
  status: DocumentStatus;
  warning?: string;
}
