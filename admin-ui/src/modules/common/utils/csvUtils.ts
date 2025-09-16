export type CSVRow = Record<string, any>;

export type RowExtractor<T> = (item: T) => CSVRow;
export const convertObjectsToCSV = (
  headers: string[],
  rows: CSVRow[],
): string => {
  if (!rows.length) return '';

  function escapeCSV(value: any): string {
    if (Array.isArray(value)) {
      value = value.join(';');
    } else if (value && typeof value === 'object') {
      value = JSON.stringify(value);
    }
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(','),
    ),
  ];

  return csvRows.join('\n');
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const parseCSV = <T>(
  csvContent: string,
  mapRow: (row: CSVRow) => T,
): T[] => {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

  const rows = lines.slice(1).map((line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"'; // escaped quote
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current); // push last field

    const row: Record<string, string> = {};
    headers.forEach((key, idx) => {
      row[key] = fields[idx]?.trim() ?? '';
    });

    return mapRow(row);
  });

  return rows;
};
