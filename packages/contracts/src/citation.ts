// A citation record from docs/architecture.md §Citation contract. IDs originate from the
// server-selected evidence set; the response validator accepts only those IDs (never a
// model-invented one).
export interface Citation {
  citationId: string;
  documentId: string;
  documentVersion: number;
  chunkId: string;
  title: string;
  page?: number;
  section?: string;
  excerpt: string;
}
