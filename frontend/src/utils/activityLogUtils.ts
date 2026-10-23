export interface ActivityLogItem {
  _id: string;
  action: string;
  actorId: string | null;
  actorRole?: string;
  actorName?: string;
  actorEmail?: string;
  organizationId?: string;
  organizationName?: string;
  workspaceId?: string;
  workspaceName?: string;
  targetType?: string;
  targetId?: string;
  occurredAt: string;
  metadata?: Record<string, any>;
}

export const isMongoId = (val?: string | null): boolean => {
  return typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());
};

export const formatAction = (action: string): string => {
  if (!action) return "Activity";
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export const getActorDisplay = (log: ActivityLogItem): { name: string; email?: string } => {
  let name = log.actorName;
  if (!name || isMongoId(name)) {
    if (log.actorId && !isMongoId(log.actorId)) {
      name = log.actorId;
    } else if (log.metadata?.ownerName && typeof log.metadata.ownerName === "string") {
      name = log.metadata.ownerName;
    } else if (log.metadata?.username && typeof log.metadata.username === "string") {
      name = log.metadata.username;
    } else if (log.actorRole) {
      name = formatAction(log.actorRole);
    } else {
      name = "System";
    }
  }

  const email =
    log.actorEmail ||
    (typeof log.metadata?.ownerEmail === "string" ? log.metadata.ownerEmail : undefined) ||
    (typeof log.metadata?.email === "string" ? log.metadata.email : undefined);

  return { name, email };
};

export const getTargetDisplay = (log: ActivityLogItem): { type: string; detail?: string } => {
  const type = log.targetType || "General";
  let detail: string | undefined;

  if (log.metadata) {
    if (typeof log.metadata.title === "string") {
      detail = log.metadata.title;
    } else if (typeof log.metadata.companyName === "string") {
      detail = log.metadata.companyName;
    } else if (typeof log.metadata.roomName === "string") {
      detail = log.metadata.roomName;
    } else if (typeof log.metadata.ownerEmail === "string") {
      detail = log.metadata.ownerEmail;
    } else if (typeof log.metadata.email === "string") {
      detail = log.metadata.email;
    }
  }

  // If targetId is not a mongo ID and we have no other detail, we can show it, otherwise never show it
  if (!detail && log.targetId && !isMongoId(log.targetId)) {
    detail = log.targetId;
  }

  return { type, detail };
};

export const getFilteredMetadataEntries = (metadata?: Record<string, any>): [string, string][] => {
  if (!metadata || typeof metadata !== "object") return [];
  const entries: [string, string][] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined || value === "") continue;
    const strVal = typeof value === "object" ? JSON.stringify(value) : String(value);
    // Ignore any string that matches a MongoDB ID or stringified array of MongoDB IDs
    if (isMongoId(strVal)) continue;
    if (key.toLowerCase().includes("id") && isMongoId(strVal)) continue;
    entries.push([key, strVal]);
  }

  return entries;
};
