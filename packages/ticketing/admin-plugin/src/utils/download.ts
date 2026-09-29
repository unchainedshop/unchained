// Browser download of text generated on the client.

/** Safe file name from an event slug or title. */
export const toFileName = (value: string, fallback = 'event') =>
  (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || fallback;

/**
 * Saves CSV text as a file. The byte order mark makes Excel read the file as UTF-8, so names with
 * umlauts and accents survive.
 */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
