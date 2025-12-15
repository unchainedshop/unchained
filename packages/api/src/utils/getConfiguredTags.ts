/**
 * Aggregates tags from multiple sources: environment variables, config defaults, and existing database tags.
 *
 * @param existingTagsFn - Async function that returns existing tags from the database
 * @param envVar - Name of the environment variable containing comma-separated tags
 * @param configDefault - Default tags from configuration (fallback if env var is not set)
 * @returns Deduplicated array of tags combining all sources
 */
export async function getConfiguredTags(
  existingTagsFn: () => Promise<string[]>,
  envVar: string,
  configDefault: string[] | undefined,
): Promise<string[]> {
  const existingTags = await existingTagsFn();
  const envTags = (process.env[envVar] || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const normalizedDefaultTags = envTags?.length ? envTags : (configDefault || []).filter(Boolean);
  return Array.from(new Set(normalizedDefaultTags.concat(existingTags)));
}
