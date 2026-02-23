import { readFile, writeFile, readdir, unlink, mkdir, stat, appendFile } from "node:fs/promises";
import { join, basename, relative } from "node:path";
import { existsSync } from "node:fs";
import { Database } from "bun:sqlite";
import type { MemoryEntry, SearchResult, SearchOptions } from "./types.js";
import { chunkMarkdown } from "./chunker.js";

const MAX_MEMORY_LINES = 200;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  line_start INTEGER,
  line_end INTEGER,
  updated_at INTEGER NOT NULL,
  UNIQUE(source, chunk_index)
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  content,
  content='chunks',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, content) VALUES (new.id, new.content);
END;

CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, content) VALUES('delete', old.id, old.content);
END;

CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, content) VALUES('delete', old.id, old.content);
  INSERT INTO chunks_fts(rowid, content) VALUES (new.id, new.content);
END;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

export class MemoryManager {
  private memoryDir: string;
  private topicsDir: string;
  private journalDir: string;
  private db: Database | null = null;

  constructor(memoryDir: string) {
    this.memoryDir = memoryDir;
    this.topicsDir = join(memoryDir, "topics");
    this.journalDir = join(memoryDir, "journal");
  }

  async init(): Promise<void> {
    await mkdir(this.memoryDir, { recursive: true });
    await mkdir(this.topicsDir, { recursive: true });
    await mkdir(this.journalDir, { recursive: true });

    const mainPath = join(this.memoryDir, "MEMORY.md");
    if (!existsSync(mainPath)) {
      await writeFile(mainPath, "");
    }

    // Open SQLite database with WAL mode for concurrent reads
    const dbPath = join(this.memoryDir, ".index.sqlite");
    this.db = new Database(dbPath);
    this.db.exec("PRAGMA journal_mode=WAL");
    this.db.exec(SCHEMA_SQL);

    // Reindex all files on init (catches any changes made while engine was down)
    await this.reindex();
  }

  /** Load MEMORY.md content for system prompt injection (truncated to MAX_MEMORY_LINES) */
  async loadContext(): Promise<string> {
    const mainPath = join(this.memoryDir, "MEMORY.md");
    if (!existsSync(mainPath)) return "";

    const content = await readFile(mainPath, "utf-8");
    const lines = content.split("\n");
    if (lines.length > MAX_MEMORY_LINES) {
      return lines.slice(0, MAX_MEMORY_LINES).join("\n") + "\n...(truncated)";
    }
    return content;
  }

  /** Save or update a topic memory entry. Writes to topics/<key>.md and updates index. */
  async save(key: string, content: string): Promise<void> {
    const safeName = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = join(this.topicsDir, `${safeName}.md`);
    await writeFile(filePath, content);
    const source = `topics/${safeName}.md`;
    this.indexFile(source, "topic", content);
  }

  /** Search across all memory files using FTS5 BM25. Returns MemoryEntry[] for backward compat. */
  async search(query: string): Promise<MemoryEntry[]> {
    const results = this.searchIndex(query);
    // Map SearchResult to MemoryEntry for backward compatibility
    return results.map((r) => {
      let key: string;
      if (r.sourceType === "memory") {
        key = "MEMORY";
      } else if (r.sourceType === "topic") {
        key = basename(r.source, ".md");
      } else {
        key = r.source.replace(/\.md$/, "");
      }
      return { key, content: r.content, updatedAt: r.updatedAt };
    });
  }

  /**
   * Full-featured search returning ranked SearchResult[] with source attribution.
   * Uses FTS5 BM25 ranking.
   */
  searchIndex(query: string, opts?: SearchOptions): SearchResult[] {
    if (!this.db || !query.trim()) return [];

    const maxResults = opts?.maxResults ?? 10;
    const sourceFilter = opts?.sourceType ?? "all";

    // Sanitize query for FTS5: escape double-quotes, wrap each term in quotes
    const sanitized = this.sanitizeFtsQuery(query);
    if (!sanitized) return [];

    try {
      let sql: string;
      const params: (string | number)[] = [];

      if (sourceFilter === "all") {
        sql = `
          SELECT c.source, c.source_type, c.content, c.line_start, c.line_end,
                 c.updated_at, rank
          FROM chunks_fts f
          JOIN chunks c ON c.id = f.rowid
          WHERE chunks_fts MATCH ?
          ORDER BY rank
          LIMIT ?
        `;
        params.push(sanitized, maxResults);
      } else {
        sql = `
          SELECT c.source, c.source_type, c.content, c.line_start, c.line_end,
                 c.updated_at, rank
          FROM chunks_fts f
          JOIN chunks c ON c.id = f.rowid
          WHERE chunks_fts MATCH ? AND c.source_type = ?
          ORDER BY rank
          LIMIT ?
        `;
        params.push(sanitized, sourceFilter, maxResults);
      }

      const rows = this.db.prepare(sql).all(...params) as Array<{
        source: string;
        source_type: string;
        content: string;
        line_start: number;
        line_end: number;
        updated_at: number;
        rank: number;
      }>;

      return rows.map((row) => ({
        source: row.source,
        sourceType: row.source_type as SearchResult["sourceType"],
        content: row.content,
        lineStart: row.line_start,
        lineEnd: row.line_end,
        score: 1 / (1 + Math.max(0, -row.rank)), // normalize BM25 rank to 0..1
        updatedAt: row.updated_at,
      }));
    } catch {
      // FTS5 query syntax errors — fall back to empty
      return [];
    }
  }

  /** Read a specific memory entry by topic key */
  async get(key: string): Promise<string | null> {
    const safeName = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = join(this.topicsDir, `${safeName}.md`);
    if (!existsSync(filePath)) return null;
    return readFile(filePath, "utf-8");
  }

  /** Delete a memory entry by topic key */
  async delete(key: string): Promise<boolean> {
    const safeName = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = join(this.topicsDir, `${safeName}.md`);
    if (!existsSync(filePath)) return false;
    await unlink(filePath);
    const source = `topics/${safeName}.md`;
    this.removeFromIndex(source);
    return true;
  }

  /** List all topic memory keys */
  async list(): Promise<string[]> {
    const keys: string[] = [];
    if (!existsSync(this.topicsDir)) return keys;
    const files = await readdir(this.topicsDir);
    for (const file of files) {
      if (file.endsWith(".md")) {
        keys.push(file.replace(/\.md$/, ""));
      }
    }
    return keys;
  }

  /** Append content to today's journal entry (creates file if needed) */
  async appendJournal(content: string, date?: string): Promise<void> {
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    const filePath = join(this.journalDir, `${dateStr}.md`);

    if (existsSync(filePath)) {
      await appendFile(filePath, `\n\n${content}`);
    } else {
      await writeFile(filePath, content);
    }

    // Re-index this journal file
    const fullContent = await readFile(filePath, "utf-8");
    const source = `journal/${dateStr}.md`;
    this.indexFile(source, "journal", fullContent);
  }

  /** Read a specific day's journal */
  async getJournal(date: string): Promise<string | null> {
    const filePath = join(this.journalDir, `${date}.md`);
    if (!existsSync(filePath)) return null;
    return readFile(filePath, "utf-8");
  }

  /** Full re-index of all memory files. Clears stale entries, indexes all current files. */
  async reindex(): Promise<void> {
    if (!this.db) return;

    // Collect all current sources from filesystem
    const currentSources = new Map<string, { type: SearchResult["sourceType"]; path: string }>();

    // MEMORY.md
    const mainPath = join(this.memoryDir, "MEMORY.md");
    if (existsSync(mainPath)) {
      currentSources.set("MEMORY.md", { type: "memory", path: mainPath });
    }

    // topics/
    if (existsSync(this.topicsDir)) {
      const topicFiles = await readdir(this.topicsDir);
      for (const f of topicFiles) {
        if (f.endsWith(".md")) {
          currentSources.set(`topics/${f}`, { type: "topic", path: join(this.topicsDir, f) });
        }
      }
    }

    // journal/
    if (existsSync(this.journalDir)) {
      const journalFiles = await readdir(this.journalDir);
      for (const f of journalFiles) {
        if (f.endsWith(".md")) {
          currentSources.set(`journal/${f}`, { type: "journal", path: join(this.journalDir, f) });
        }
      }
    }

    // Get indexed sources and their timestamps
    const indexed = new Map<string, number>();
    const rows = this.db.prepare(
      "SELECT DISTINCT source, MAX(updated_at) as updated_at FROM chunks GROUP BY source"
    ).all() as Array<{ source: string; updated_at: number }>;
    for (const row of rows) {
      indexed.set(row.source, row.updated_at);
    }

    // Remove stale (deleted files)
    for (const source of indexed.keys()) {
      if (!currentSources.has(source)) {
        this.removeFromIndex(source);
      }
    }

    // Index new or modified files
    for (const [source, info] of currentSources) {
      const fileStat = await stat(info.path);
      const fileMtime = Math.floor(fileStat.mtimeMs);
      const indexedAt = indexed.get(source);

      if (indexedAt === undefined || fileMtime > indexedAt) {
        const content = await readFile(info.path, "utf-8");
        this.indexFile(source, info.type, content);
      }
    }
  }

  /** Close the database (for clean shutdown) */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // --- Private helpers ---

  /** Chunk and index a file's content */
  private indexFile(source: string, sourceType: SearchResult["sourceType"], content: string): void {
    if (!this.db) return;

    const now = Date.now();
    const chunks = chunkMarkdown(content);

    // Remove existing chunks for this source
    this.removeFromIndex(source);

    if (chunks.length === 0) return;

    const insert = this.db.prepare(
      `INSERT INTO chunks (source, source_type, chunk_index, content, line_start, line_end, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const tx = this.db.transaction(() => {
      for (let i = 0; i < chunks.length; i++) {
        insert.run(source, sourceType, i, chunks[i].content, chunks[i].lineStart, chunks[i].lineEnd, now);
      }
    });
    tx();
  }

  /** Remove all chunks for a source from the index */
  private removeFromIndex(source: string): void {
    if (!this.db) return;
    this.db.prepare("DELETE FROM chunks WHERE source = ?").run(source);
  }

  /** Sanitize a search query for FTS5 MATCH syntax */
  private sanitizeFtsQuery(query: string): string {
    // Split into tokens, escape each, join with implicit AND
    const tokens = query
      .replace(/['"]/g, "") // strip quotes
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .map((t) => `"${t}"`); // quote each token for exact matching

    return tokens.join(" ");
  }
}
