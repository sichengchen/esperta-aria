export interface RelayDeviceRecord {
  deviceId: string;
  label: string;
  pairedAt: number;
  pairingToken?: string | null;
  lastSeenAt?: number | null;
  metadataJson?: string | null;
  revokedAt?: number | null;
}

export type RelayAttachmentKind = "aria_thread" | "remote_project_thread" | "remote_job_stream";
export type RelayTransportMode = "direct" | "relay_assisted" | "relay_tunnel";

export interface RelaySessionAttachmentRecord {
  attachmentId: string;
  deviceId: string;
  sessionId: string;
  serverId?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
  threadId?: string | null;
  jobId?: string | null;
  attachmentKind?: RelayAttachmentKind | null;
  transportMode?: RelayTransportMode | null;
  resumable?: boolean;
  attachedAt: number;
  detachedAt?: number | null;
  canSendMessages: boolean;
  canRespondToApprovals: boolean;
}

export type RelayQueuedEventType = "follow_up" | "approval_response";

export interface RelayQueuedEventRecord {
  eventId: string;
  deviceId: string;
  sessionId: string;
  serverId?: string | null;
  threadId?: string | null;
  jobId?: string | null;
  type: RelayQueuedEventType;
  payloadJson: string;
  createdAt: number;
  deliveredAt?: number | null;
}

export interface RelayAttachmentRequest {
  deviceId: string;
  sessionId: string;
  serverId?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
  threadId?: string | null;
  jobId?: string | null;
  attachmentKind?: RelayAttachmentKind | null;
  transportMode?: RelayTransportMode | null;
  connectorType?: string | null;
}

export interface RelayApprovalResponse {
  deviceId: string;
  sessionId: string;
  toolCallId: string;
  approved: boolean;
  serverId?: string | null;
  threadId?: string | null;
  jobId?: string | null;
}

export interface RelayFollowUpMessage {
  deviceId: string;
  sessionId: string;
  message: string;
  serverId?: string | null;
  threadId?: string | null;
  jobId?: string | null;
}
