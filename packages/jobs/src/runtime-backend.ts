export type RuntimeBackendId = "aria" | (string & {});

export type RuntimeBackendApprovalMode = "auto" | "gated" | "suggest";

export type RuntimeBackendExecutionStatus = "succeeded" | "failed" | "timed_out" | "cancelled";

export type RuntimeBackendEventType =
  | "execution.started"
  | "execution.waiting_approval"
  | "execution.stdout"
  | "execution.stderr"
  | "execution.completed";

export interface RuntimeBackendTokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface RuntimeBackendCapabilities {
  supportsStreamingEvents: boolean;
  supportsCancellation: boolean;
  supportsStructuredOutput: boolean;
  supportsFileEditing: boolean;
  supportsBackgroundExecution: boolean;
  supportsAuthProbe: boolean;
}

export interface RuntimeBackendAvailability {
  available: boolean;
  detectedVersion?: string | null;
  authState?: "configured" | "missing" | "unknown";
  reason?: string | null;
}

export interface RuntimeBackendExecutionRequest {
  executionId: string;
  prompt: string;
  workingDirectory: string;
  timeoutMs: number;
  modelId?: string | null;
  maxTurns?: number | null;
  approvalMode: RuntimeBackendApprovalMode;
  env?: Record<string, string>;
  sessionId?: string | null;
  threadId?: string | null;
  taskId?: string | null;
  metadata?: Record<string, string>;
}

export interface RuntimeBackendExecutionEvent {
  type: RuntimeBackendEventType;
  backend: RuntimeBackendId;
  executionId: string;
  timestamp: number;
  chunk?: string;
  status?: RuntimeBackendExecutionStatus;
  summary?: string | null;
  metadata?: Record<string, string>;
}

export interface RuntimeBackendExecutionResult {
  backend: RuntimeBackendId;
  executionId: string;
  status: RuntimeBackendExecutionStatus;
  exitCode: number;
  stdout: string;
  stderr: string;
  summary?: string | null;
  filesChanged: string[];
  tokenUsage?: RuntimeBackendTokenUsage;
  metadata?: Record<string, string>;
}

export interface RuntimeBackendExecutionObserver {
  onEvent?(event: RuntimeBackendExecutionEvent): void | Promise<void>;
}

export interface RuntimeBackendAdapter {
  readonly backend: RuntimeBackendId;
  readonly displayName: string;
  readonly capabilities: RuntimeBackendCapabilities;
  probeAvailability(): Promise<RuntimeBackendAvailability>;
  execute(
    request: RuntimeBackendExecutionRequest,
    observer?: RuntimeBackendExecutionObserver,
  ): Promise<RuntimeBackendExecutionResult>;
  cancel(executionId: string): Promise<void>;
}

export interface AriaRuntimeExecutionDriver {
  execute(
    request: RuntimeBackendExecutionRequest,
    observer?: RuntimeBackendExecutionObserver,
  ): Promise<RuntimeBackendExecutionResult>;
  cancel(executionId: string): Promise<void>;
}

export interface AriaRuntimeBackendOptions {
  available?: boolean;
  version?: string | null;
  driver: AriaRuntimeExecutionDriver;
}

export class AriaRuntimeBackendAdapter implements RuntimeBackendAdapter {
  readonly backend = "aria";
  readonly displayName = "Aria Runtime";
  readonly capabilities: RuntimeBackendCapabilities = {
    supportsStreamingEvents: true,
    supportsCancellation: true,
    supportsStructuredOutput: true,
    supportsFileEditing: true,
    supportsBackgroundExecution: true,
    supportsAuthProbe: false,
  };

  constructor(private readonly options: AriaRuntimeBackendOptions) {}

  async probeAvailability(): Promise<RuntimeBackendAvailability> {
    return {
      available: this.options.available ?? true,
      detectedVersion: this.options.version ?? null,
      authState: "unknown",
      reason: null,
    };
  }

  async execute(
    request: RuntimeBackendExecutionRequest,
    observer?: RuntimeBackendExecutionObserver,
  ): Promise<RuntimeBackendExecutionResult> {
    return this.options.driver.execute(request, observer);
  }

  async cancel(executionId: string): Promise<void> {
    await this.options.driver.cancel(executionId);
  }
}

export function createAriaRuntimeBackendAdapter(
  options: AriaRuntimeBackendOptions,
): AriaRuntimeBackendAdapter {
  return new AriaRuntimeBackendAdapter(options);
}
