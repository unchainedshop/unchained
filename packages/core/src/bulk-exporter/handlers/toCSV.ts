const toCSV = (headers: string[], rows: Record<string, any>[]) => {
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
};

export default toCSV;
