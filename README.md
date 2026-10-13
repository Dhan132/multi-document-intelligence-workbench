# Multi-Document Intelligence Workbench

This project is a full-stack document analysis workbench. It lets users upload multiple PDF, TXT, and CSV documents, ask a question or provide analysis instructions, and then get a structured, source-aware summary, comparison, and discrepancy review.

The initial analyzer is a deterministic, rule-based mock service. It uses actual extracted text from the uploaded documents and intentionally labels its results as heuristic rather than as a verified AI finding. This keeps the architecture ready for a future real LLM or provider integration without needing a rewrite of the frontend or API contract.

## Architecture

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: SQLite via better-sqlite3
- Upload handling: Multer
- PDF extraction: pdf-parse
- Validation: Zod for request validation

## Prerequisites

- Node.js 20+
- npm
- Git

## Installation

1. Install the root workspace dependencies if needed.
2. Install backend dependencies in the api folder.
3. Install frontend dependencies in the web folder.

```bash
cd api
npm install

cd ../web
npm install
```

## Environment setup

Copy the example environment file for the API and adjust values if needed.

```bash
cd api
copy .env.example .env
```

Example values:

```env
PORT=3001
NODE_ENV=development
MAX_FILE_SIZE_MB=5
MAX_FILES_PER_REQUEST=10
UPLOAD_DIR=./tmp/uploads
DB_PATH=./data/mdi.db
CORS_ORIGIN=http://localhost:5173
```

## Running the application

Open two terminals.

Terminal 1 - backend:

```bash
cd api
npm run dev
```

Terminal 2 - frontend:

```bash
cd web
npm run dev
```

The Vite frontend is configured to proxy /api requests to http://localhost:3001.

## API endpoints

### GET /api/health

Returns service health information.

### POST /api/documents/upload

Accepts multipart/form-data with a field named documents. Supports PDF, TXT, and CSV files. Returns metadata about each file including id, filename, file type, size, extracted text length, and processing status.

### GET /api/documents

Returns stored document metadata without exposing raw content unnecessarily.

### POST /api/analyze

Request body:

```json
{
  "documentIds": ["uuid-1", "uuid-2"],
  "prompt": "Summarize the key risks and compare values across the documents."
}
```

Response includes structured analysis sections such as summary, key findings, discrepancies, missing information, extracted key-value pairs, and source references.

## Supported types and limits

- PDF, TXT, CSV
- Maximum file size: 5 MB by default
- Maximum files per request: 10
- File validation runs on extension, MIME type, and size

## Database schema and retention approach

SQLite is used for storing:

- Documents
- Analysis runs
- Analysis result payloads

The schema includes document ids, filenames, MIME types, file sizes, extracted text length, status, timestamps, and analysis metadata. Extracted text is stored temporarily for rule-based analysis and is intended to be cleaned up with a retention policy when the application moves beyond prototype use. The general approach is to keep only the minimal extracted-text records needed for analysis and to purge old analysis records on a scheduled basis.

## Mock analyzer limitations

The current analyzer is intentionally heuristic and rule-based:

- It uses extracted text from the actual uploaded documents.
- It identifies likely key-value pairs, comparisons, and discrepancies.
- It does not claim that results are verified facts.
- It should be validated by a human before using the output for decisions.

## Security considerations

- Files are treated as untrusted data.
- Uploaded content is never executed.
- File extension and MIME checks are enforced.
- SQL statements are parameterized.
- Environment variables store server-side config and any future AI keys.
- Raw file contents are not retained for longer than necessary.

## Testing

The backend includes synthetic tests for health checks and file extraction. The project scripts are intended to be run with TypeScript-aware tooling.

```bash
cd api
npm test

cd ../web
npm run build
```

## Known limitations and future improvements

- The current analysis is rule-based, not a true LLM.
- Extraction is suitable for plain text, simple CSVs, and readable PDFs.
- Complex PDFs or low-quality OCR output may require a stronger extraction layer.
- A future real AI provider can be inserted behind the same analysis interface without changing the frontend contract.
