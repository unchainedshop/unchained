export async function executeBulkOperation<T>(
  ids: T[],
  operation: (id: T) => Promise<unknown>,
): Promise<{ successIds: T[]; failedIds: T[] }> {
  const results = await Promise.allSettled(ids.map((id) => operation(id).then(() => id)));

  const successIds: T[] = [];
  const failedIds: T[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successIds.push(result.value);
    } else {
      failedIds.push(ids[index]);
    }
  });

  return { successIds, failedIds };
}
