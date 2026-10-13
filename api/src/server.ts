import cors from 'cors';
import express, { type Request, type Response } from 'express';

import { config } from './config';
import { initializeDatabase } from './db/database';
import analysisRoutes from './routes/analysis.routes';
import documentsRoutes from './routes/documents.routes';

const app = express();

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Multi-Document Intelligence API is running',
  });
});

app.use('/api', analysisRoutes);
app.use('/api/documents', documentsRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API root is available',
  });
});

app.use((error: Error, _req: Request, res: Response, _next: () => void) => {
  const message = error.message || 'An unexpected server error occurred.';
  res.status(400).json({
    success: false,
    message,
  });
});

const startServer = () => {
  initializeDatabase();

  app.listen(config.port, () => {
    console.log(`Multi-Document Intelligence API running on http://localhost:${config.port}`);
  });
};

if (require.main === module) {
  startServer();
}

export { app, startServer };
