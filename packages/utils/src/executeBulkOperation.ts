export async function executeBulkOperation<T>(
  ids: readonly T[],
  operation: (id: T) => Promise<unknown>,
): Promise<{ successIds: T[]; failedIds: T[] }> {
  const successIds: T[] = [];
  const failedIds: T[] = [];

  for (const id of new Set(ids)) {
    try {
      await operation(id);
      successIds.push(id);
    } catch {
      failedIds.push(id);
    }
  }

  return { successIds, failedIds };
}
