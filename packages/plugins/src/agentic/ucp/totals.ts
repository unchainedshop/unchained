export interface TotalLine {
  display_text: string;
  amount: number;
}

export interface Total {
  type: string;
  amount: number;
  display_text?: string;
  lines?: TotalLine[];
}

export interface RatedTax {
  rate: number;
  amount: number;
}

export const vatLabel = (rate: number) => `VAT ${Number((rate * 100).toFixed(2))}%`;

export function vatLines(total: number, taxSum: number, rated: RatedTax[]): TotalLine[] {
  const vat = Math.round(taxSum);
  if (!vat) return [];
  const perRate = [
    ...rated.reduce(
      (sums, { rate, amount }) => sums.set(rate, (sums.get(rate) ?? 0) + amount),
      new Map<number, number>(),
    ),
  ]
    .toSorted(([a], [b]) => b - a)
    .map(([rate, amount]) => ({
      rate,
      amount: Math.floor(amount),
      remainder: amount - Math.floor(amount),
    }));
  const ratedVat = rated.reduce((sum, { amount }) => sum + amount, 0);
  if (!perRate.length || Math.round(ratedVat) !== vat) {
    return [
      { display_text: 'Net', amount: total - vat },
      { display_text: 'VAT', amount: vat },
    ];
  }
  let unassigned = vat - perRate.reduce((sum, { amount }) => sum + amount, 0);
  for (const share of perRate.toSorted((a, b) => b.remainder - a.remainder)) {
    if (unassigned <= 0) break;
    share.amount += 1;
    unassigned -= 1;
  }
  return [
    { display_text: 'Net', amount: total - vat },
    ...perRate
      .filter(({ amount }) => amount)
      .map(({ rate, amount }) => ({ display_text: vatLabel(rate), amount })),
  ];
}

export function checkoutTotals({
  subtotal,
  itemsDiscount,
  discount,
  fulfillment,
  fee,
  total,
  taxSum,
  rated,
}: {
  subtotal: number;
  itemsDiscount: number;
  discount: number;
  fulfillment: number;
  fee: number;
  total: number;
  taxSum: number;
  rated: RatedTax[];
}): Total[] {
  const entries: Total[] = [
    { type: 'subtotal', amount: subtotal },
    ...(itemsDiscount < 0 ? [{ type: 'items_discount', amount: itemsDiscount }] : []),
    ...(discount < 0 ? [{ type: 'discount', amount: discount }] : []),
    ...(fulfillment > 0 ? [{ type: 'fulfillment', amount: fulfillment }] : []),
    ...(fee > 0 ? [{ type: 'fee', amount: fee }] : []),
  ];
  const rounding = total - entries.reduce((sum, { amount }) => sum + amount, 0);
  const lines = vatLines(total, taxSum, rated);
  return [
    ...entries,
    ...(rounding ? [{ type: 'rounding', display_text: 'Rounding', amount: rounding }] : []),
    { type: 'total', amount: total, ...(lines.length ? { lines } : {}) },
  ];
}
