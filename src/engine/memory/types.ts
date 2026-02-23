export interface MemoryEntry {
  key: string;
  content: string;
  updatedAt: number;
}

/** A ranked search result from the memory index. */
export interface SearchResult {
  /** File path relative to memory dir (e.g. "topics/user-address.md") */
  source: string;
  /** Source classification */
  sourceType: "memory" | "topic" | "journal";
  /** Chunk text (snippet) */
  content: string;
  /** First line of this chunk in the source file (1-indexed) */
  lineStart: number;
  /** Last line of this chunk in the source file (1-indexed) */
  lineEnd: number;
  /** BM25 relevance score (lower rank = more relevant; normalized to 0..1 for consumers) */
  score: number;
  /** Unix timestamp of last update */
  updatedAt: number;
}

/** Options for memory search. */
export interface SearchOptions {
  /** Maximum number of results to return (default: 10) */
  maxResults?: number;
  /** Filter by source type (default: "all") */
  sourceType?: "memory" | "topic" | "journal" | "all";
}
