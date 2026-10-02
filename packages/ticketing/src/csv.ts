// CSV cells and rows, shared with the admin plugin bundle: no imports.

// Spreadsheets run cells starting with these as formulas; names and addresses are customer input.
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",;\r\n]/;

/** Numbers stay numbers, text is quoted where needed and defused when it looks like a formula. */
export const csvCell = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: unknown[][]) =>
  rows.map((row) => `${row.map(csvCell).join(',')}\r\n`).join('');
