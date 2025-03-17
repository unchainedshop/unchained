export function assertDocumentDBCompatMode() {
  if (isDocumentDBCompatModeEnabled())
    throw new Error('Text search is not supported in DocumentDB Compatibility Mode');
}

export const isDocumentDBCompatModeEnabled = () => Boolean(process.env.UNCHAINED_DOCUMENTDB_COMPAT_MODE);
