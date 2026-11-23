export const currencyDecimals = (decimals?: number | null) => Math.min(decimals ?? 2, 9);
