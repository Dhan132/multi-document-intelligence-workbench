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
