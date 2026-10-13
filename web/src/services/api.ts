import axios from 'axios';

import type { AnalysisResponse, UploadDocumentResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadDocuments = async (formData: FormData) => {
  const response = await api.post<{ success: boolean; documents: UploadDocumentResponse[]; message?: string }>(
    '/documents/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get<{ success: boolean; documents: UploadDocumentResponse[] }>( '/documents');
  return response.data;
};

export const analyzeDocuments = async (documentIds: string[], prompt: string) => {
  const response = await api.post<AnalysisResponse>('/analyze', {
    documentIds,
    prompt,
  });

  return response.data;
};

export default api;
