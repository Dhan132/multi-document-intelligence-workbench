import { useRef, useState } from 'react';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Clipboard,
  FileText,
  LoaderCircle,
  UploadCloud,
  X,
} from 'lucide-react';

import './App.css';
import { analyzeDocuments, uploadDocuments } from './services/api';
import type { AnalysisResponse, UploadDocumentResponse } from './types';

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const renderAnalysisText = (response: AnalysisResponse) => {
  const analysis = response.analysis;
  const sections: string[] = [
    'Multi-Document Intelligence Workbench Analysis',
    '',
    `Executive Summary: ${analysis.summary}`,
    '',
    'Key Findings:',
    ...analysis.keyFindings.map((finding, index) => `${index + 1}. ${finding.claim} (${finding.type})`),
    '',
    'Cross-Document Comparison:',
    ...analysis.comparisons.map((entry, index) => `${index + 1}. ${entry.label}: ${entry.values.map((value) => `${value.filename}: ${value.value}`).join('; ')}`),
    '',
    'Discrepancies:',
    ...analysis.discrepancies.map((item, index) => `${index + 1}. ${item.label}: ${item.description}`),
    '',
    'Missing Information:',
    ...analysis.missingInformation.map((item, index) => `${index + 1}. ${item.field}: ${item.reason}`),
    '',
    'Extracted Key-Value Data:',
    ...analysis.keyValues.map((item, index) => `${index + 1}. ${item.key}: ${item.value}`),
    '',
    'Interpretation and Limitations:',
    ...analysis.interpretations.map((item, index) => `${index + 1}. ${item.statement}`),
    ...analysis.limitations.map((item, index) => `- ${item}`),
  ];

  return sections.join('\n');
};

function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadDocumentResponse[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const validDocuments = uploadedDocuments.filter((document) => document.status === 'ready');

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files) return;

    const nextFiles = Array.from(files).filter((file) => file.size > 0 && /\.(pdf|txt|csv)$/i.test(file.name));

    if (nextFiles.length === 0) {
      setErrorMessage('Only PDF, TXT, and CSV documents are supported.');
      return;
    }

    setSelectedFiles(nextFiles);
    setErrorMessage('');
    setStatusMessage(`${nextFiles.length} ready to upload.`);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Select at least one document to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setStatusMessage('Uploading documents...');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('documents', file));

      const response = await uploadDocuments(formData);
      const documents = response.documents ?? [];

      setUploadedDocuments(documents);
      setSelectedFiles([]);

      if (documents.length === 0) {
        setStatusMessage('No documents were accepted.');
        return;
      }

      const accepted = documents.filter((document) => document.status === 'ready').length;
      const rejected = documents.filter((document) => document.status !== 'ready').length;

      setStatusMessage(
        accepted > 0
          ? `${accepted} document(s) uploaded successfully${rejected > 0 ? ` and ${rejected} were rejected` : ''}.`
          : 'Upload was processed, but no document was ready for analysis.',
      );

      if (documents.some((document) => document.warning)) {
        setErrorMessage(documents.find((document) => document.warning)?.warning ?? '');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setErrorMessage(message);
      setStatusMessage('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (validDocuments.length === 0) {
      setErrorMessage('Upload one or more valid documents before analyzing.');
      return;
    }

    if (prompt.trim().length < 10) {
      setErrorMessage('Enter a question or analysis instructions with at least 10 characters.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setStatusMessage('Running analysis...');

    try {
      const result = await analyzeDocuments(
        validDocuments.map((document) => document.id),
        prompt.trim(),
      );

      setAnalysis(result);
      setStatusMessage('Analysis complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The analysis request failed.';
      setErrorMessage(message);
      setStatusMessage('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeUploadedDocument = (id: string) => {
    setUploadedDocuments((current) => current.filter((document) => document.id !== id));
    setAnalysis(null);
  };

  const copyResults = async () => {
    if (!analysis) return;

    try {
      await navigator.clipboard.writeText(renderAnalysisText(analysis));
      setStatusMessage('Results copied to the clipboard.');
    } catch {
      setErrorMessage('Copy failed in this browser. Try selecting the text manually.');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Document intelligence</p>
          <h1>Multi-Document Intelligence Workbench</h1>
        </div>
      </header>

      <main className="workspace">
        <section className="panel panel-upload">
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFiles(event.dataTransfer.files);
            }}
          >
            <UploadCloud size={26} />
            <p>Upload multiple PDF, TXT, or CSV files</p>
            <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>
              Choose files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt,.csv,text/plain,text/csv,application/pdf"
              multiple
              hidden
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>

          <div className="upload-meta">
            <span>Accepted: PDF, TXT, CSV</span>
            <span>Limit: 5 MB per file</span>
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-files">
              {selectedFiles.map((file) => (
                <div key={`${file.name}-${file.size}`} className="file-pill">
                  <FileText size={16} />
                  <span>{file.name}</span>
                  <small>{formatBytes(file.size)}</small>
                </div>
              ))}
            </div>
          )}

          <div className="upload-actions">
            <button type="button" className="primary-button" onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? <LoaderCircle className="spinner" size={16} /> : <UploadCloud size={16} />}
              {isUploading ? 'Uploading...' : 'Upload files'}
            </button>
          </div>
        </section>

        <section className="panel panel-documents">
          <div className="panel-header">
            <h2>Uploaded files</h2>
            <span>{uploadedDocuments.length} total</span>
          </div>

          {uploadedDocuments.length === 0 ? (
            <div className="empty-box">No documents uploaded yet.</div>
          ) : (
            <ul className="document-list">
              {uploadedDocuments.map((document) => (
                <li key={document.id} className={`document-item ${document.status}`}>
                  <div>
                    <strong>{document.filename}</strong>
                    <div className="meta-row">
                      <span>{document.fileType.toUpperCase() || 'FILE'}</span>
                      <span>{formatBytes(document.sizeBytes)}</span>
                      <span>{document.status}</span>
                    </div>
                  </div>
                  <button type="button" aria-label={`Remove ${document.filename}`} onClick={() => removeUploadedDocument(document.id)}>
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel-prompts">
          <label htmlFor="prompt" className="prompt-label">Analysis prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: Summarize the most important operational risks and compare any differences in the reported status across documents."
            rows={5}
          />

          <button
            type="button"
            className="primary-button analyze-button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || validDocuments.length === 0 || prompt.trim().length < 10}
          >
            {isAnalyzing ? <LoaderCircle className="spinner" size={16} /> : <Brain size={16} />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </section>

        {(statusMessage || errorMessage) && (
          <div className={`message-bar ${errorMessage ? 'error' : 'success'}`}>
            {errorMessage ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{errorMessage || statusMessage}</span>
          </div>
        )}

        <section className="panel results-panel">
          <div className="panel-header results-header">
            <h2>Analysis results</h2>
            <button type="button" className="secondary-button" onClick={copyResults} disabled={!analysis}>
              <Clipboard size={16} /> Copy results
            </button>
          </div>

          {!analysis ? (
            <div className="empty-box">Upload documents and submit an analysis prompt to see structured findings here.</div>
          ) : (
            <div className="result-content">
              <ResultSection title="Executive Summary" body={analysis.analysis.summary} />
              <ResultSection title="Key Findings" list={analysis.analysis.keyFindings.map((item) => `${item.claim} (${item.type})`)} />
              <ResultSection title="Cross-Document Comparison" list={analysis.analysis.comparisons.map((item) => `${item.label}: ${item.values.map((value) => `${value.filename}=${value.value}`).join(', ')}`)} />
              <ResultSection title="Discrepancies" list={analysis.analysis.discrepancies.map((item) => `${item.label}: ${item.description}`)} />
              <ResultSection title="Missing Information" list={analysis.analysis.missingInformation.map((item) => `${item.field}: ${item.reason}`)} />
              <ResultSection title="Extracted Key-Value Data" list={analysis.analysis.keyValues.map((item) => `${item.key}: ${item.value}`)} />
              <ResultSection title="Sources and Evidence" list={analysis.analysis.keyFindings.flatMap((item) => item.sources.map((source) => `${source.filename}: ${source.evidence}`))} />
              <ResultSection title="Interpretation and Limitations" list={[
                ...analysis.analysis.interpretations.map((item) => item.statement),
                ...analysis.analysis.limitations,
              ]} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ResultSection({ title, body, list }: { title: string; body?: string; list?: string[] }) {
  return (
    <div className="result-section">
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {list && list.length > 0 ? (
        <ul>
          {list.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No items available.</p>
      )}
    </div>
  );
}

export default App;
