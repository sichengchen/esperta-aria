#!/usr/bin/env bun

import { startServer } from "./server.js";

const port = process.env.SA_ENGINE_PORT
  ? parseInt(process.env.SA_ENGINE_PORT, 10)
  : undefined;

const server = startServer({ port });

// Graceful shutdown
function shutdown() {
  console.log("\nSA Engine shutting down...");
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
