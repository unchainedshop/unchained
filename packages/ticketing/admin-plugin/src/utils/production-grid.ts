// The performances of a production as a grid: rows by start, columns by ticket category. Pure.

interface GridAssignment {
  vectors?: { variation?: { key?: string } | null; option?: { value?: string | null } | null }[];
  product?: any;
}

interface GridProduction {
  ticketProduction?: { categories?: { code: string }[] | null } | null;
  assignments?: GridAssignment[] | null;
}

export interface PerformanceRow {
  startsAt: string;
  /** The product per category code (productions without categories: see products). */
  cells: Record<string, any>;
  products: any[];
}

const valueOf = (assignment: GridAssignment, key: string) =>
  assignment.vectors?.find(({ variation }) => variation?.key === key)?.option?.value ?? null;

export function buildPerformanceGrid(production?: GridProduction | null): {
  columns: (string | null)[];
  rows: PerformanceRow[];
} {
  const codes = production?.ticketProduction?.categories?.map(({ code }) => code) ?? [];
  const rows = new Map<string, PerformanceRow>();
  for (const assignment of production?.assignments ?? []) {
    const startsAt = valueOf(assignment, 'slot');
    if (!startsAt) continue;
    if (!rows.has(startsAt)) rows.set(startsAt, { startsAt, cells: {}, products: [] });
    const row = rows.get(startsAt)!;
    const category = valueOf(assignment, 'category');
    if (category) row.cells[category] = assignment.product;
    row.products.push(assignment.product);
  }
  return {
    columns: codes.length ? codes : [null],
    rows: [...rows.values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
  };
}
