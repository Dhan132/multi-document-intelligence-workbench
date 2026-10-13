import fs from 'fs';
import path from 'path';
import Database, { type Database as SqliteDatabase } from 'better-sqlite3';

import { config } from '../config';

const dbDirectory = path.dirname(config.dbPath);

if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const db: SqliteDatabase = new Database(config.dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initializeDatabase = () => {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mimeType TEXT,
      extension TEXT,
      sizeBytes INTEGER NOT NULL,
      extractedTextLength INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'stored',
      extractedText TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(createdAt);

    CREATE TABLE IF NOT EXISTS analysis_runs (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      documentIds TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_analysis_runs_created_at ON analysis_runs(createdAt);

    CREATE TABLE IF NOT EXISTS analysis_results (
      id TEXT PRIMARY KEY,
      analysisRunId TEXT NOT NULL,
      resultJson TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (analysisRunId) REFERENCES analysis_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_analysis_results_analysis_run_id ON analysis_results(analysisRunId);
  `;

  db.exec(schemaSql);
  return db;
};

const runParameterized = <T = unknown>(sql: string, params: unknown[] = []): T => {
  const stmt = db.prepare(sql);
  return stmt.run(...params) as T;
};

const getDocumentById = (documentId: string) => {
  const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
  return stmt.get(documentId) as Record<string, unknown> | undefined;
};

const insertDocument = (document: {
  id: string;
  filename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  extractedTextLength: number;
  status: string;
  extractedText?: string;
}) => {
  const stmt = db.prepare(`
    INSERT INTO documents (
      id,
      filename,
      mimeType,
      extension,
      sizeBytes,
      extractedTextLength,
      status,
      extractedText,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    document.id,
    document.filename,
    document.mimeType,
    document.extension,
    document.sizeBytes,
    document.extractedTextLength,
    document.status,
    document.extractedText ?? null,
  );
};

const listDocuments = () => {
  const stmt = db.prepare(`
    SELECT id, filename, mimeType, extension, sizeBytes, extractedTextLength, status, createdAt, updatedAt
    FROM documents
    ORDER BY createdAt DESC
  `);

  return stmt.all() as Record<string, unknown>[];
};

export {
  db,
  getDocumentById,
  initializeDatabase,
  insertDocument,
  listDocuments,
  runParameterized,
};
