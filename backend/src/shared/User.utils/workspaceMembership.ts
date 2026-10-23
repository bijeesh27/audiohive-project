interface UserWorkspaceReferences {
  workspaceIds?: unknown[];
  workspaceId?: unknown;
}

function toWorkspaceId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return null;

  const reference = value as { _id?: unknown; toString?: () => string };
  const id = reference._id ?? value;
  if (!id || typeof id !== "object" && typeof id !== "string") return null;
  const text = id.toString();
  return text === "[object Object]" ? null : text;
}

/** Reads both the new array and the legacy field during the data migration. */
export function getUserWorkspaceIds(user: UserWorkspaceReferences): string[] {
  return Array.from(
    new Set(
      [...(user.workspaceIds ?? []), user.workspaceId]
        .map(toWorkspaceId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

export function isUserAssignedToWorkspace(
  user: UserWorkspaceReferences,
  workspaceId: string,
): boolean {
  return getUserWorkspaceIds(user).includes(workspaceId);
}
