/** tRPC context — available in every procedure */
export interface EngineContext {
  /** Session ID from the Connector (if authenticated) */
  sessionId: string | null;
}

/** Create context for each tRPC request */
export function createContext(): EngineContext {
  return {
    sessionId: null,
  };
}
