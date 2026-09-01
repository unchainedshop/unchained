// Node's ERR_MODULE_NOT_FOUND message embeds the importing file's path ("Cannot find
// package 'X' imported from <path>"), so a raw substring test on the peer's name would
// misclassify transitive load failures INSIDE an installed package as "not installed".
// Match the missing specifier itself instead.
export function isPeerNotInstalledError(packageName: string, error: unknown): boolean {
  if ((error as { code?: string })?.code !== 'ERR_MODULE_NOT_FOUND') return false;
  const match = String((error as Error)?.message || '').match(
    /^Cannot find (?:package|module) '([^']+)'/,
  );
  return !!match && (match[1] === packageName || match[1].startsWith(`${packageName}/`));
}
