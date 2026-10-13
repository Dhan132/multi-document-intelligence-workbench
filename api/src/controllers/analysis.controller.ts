import { z } from 'zod';

import { getDocumentById } from '../db/database';
import { runMockAnalysis } from '../services/mock-analyzer.service';

const analysisRequestSchema = z.object({
  documentIds: z.array(z.string()).min(1).max(25),
  prompt: z.string().trim().min(10).max(2000),
});

export const analyzeDocuments = async (req: Express.Request, res: Express.Response) => {
  const parsed = analysisRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid analysis request. Provide at least one document ID and a prompt between 10 and 2000 characters.',
      errors: parsed.error.flatten(),
    });
  }

  const { documentIds, prompt } = parsed.data;

  const missingDocuments = documentIds.filter((documentId) => !getDocumentById(documentId));

  if (missingDocuments.length > 0) {
    return res.status(404).json({
      success: false,
      message: 'One or more requested documents could not be found.',
      missingDocumentIds: missingDocuments,
    });
  }

  try {
    const analysis = await runMockAnalysis(documentIds, prompt);

    if (!analysis.success) {
      return res.status(400).json(analysis);
    }

    return res.status(200).json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed unexpectedly.';

    return res.status(500).json({
      success: false,
      message,
    });
  }
};
