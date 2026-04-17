import { createRequire } from "node:module";

type SqliteStatementLike = {
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => unknown;
};

export type SqliteDatabaseLike = {
  close: () => void;
  exec: (sql: string) => unknown;
  prepare: (sql: string) => SqliteStatementLike;
};

type SqliteDatabaseConstructor = new (path: string) => SqliteDatabaseLike;

let databaseConstructor: SqliteDatabaseConstructor | null = null;

export function createDesktopSqliteDatabase(path: string): SqliteDatabaseLike {
  if (!databaseConstructor) {
    const require = createRequire(import.meta.url);

    try {
      const sqliteModule = require("node:sqlite") as {
        DatabaseSync?: SqliteDatabaseConstructor;
      };

      if (sqliteModule.DatabaseSync) {
        databaseConstructor = sqliteModule.DatabaseSync;
      }
    } catch {
      databaseConstructor = null;
    }

    if (!databaseConstructor) {
      const sqliteModule = require("bun:sqlite") as {
        Database?: SqliteDatabaseConstructor;
      };

      if (!sqliteModule.Database) {
        throw new Error("No supported SQLite runtime is available");
      }

      databaseConstructor = sqliteModule.Database;
    }
  }

  return new databaseConstructor(path);
}
