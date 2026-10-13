import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB ?? 5),
  maxFilesPerRequest: Number(process.env.MAX_FILES_PER_REQUEST ?? 10),
  uploadDir: process.env.UPLOAD_DIR ?? './tmp/uploads',
  dbPath: process.env.DB_PATH ?? './data/mdi.db',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
