export interface ActivityLogInputDTO {
  occurredAt?: Date;

  action: string;

  actorId: string | null;

  actorRole?: string;

  organizationId?: string;

  workspaceId?: string;

  targetType?: string;

  targetId?: string;

  requestId?: string;

  metadata?: Record<string, string | number | boolean | null>;
}