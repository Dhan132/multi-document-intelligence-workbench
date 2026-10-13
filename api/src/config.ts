import dotenv from 'dotenv';

dotenv.config();

const defaultCorsOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB ?? 5),
  maxFilesPerRequest: Number(process.env.MAX_FILES_PER_REQUEST ?? 10),
  uploadDir: process.env.UPLOAD_DIR ?? './tmp/uploads',
  dbPath: process.env.DB_PATH ?? './data/mdi.db',
  corsOrigin: configuredOrigins.length > 0 ? configuredOrigins : defaultCorsOrigins,
};
