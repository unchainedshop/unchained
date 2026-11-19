export const toMinorUnit = (value: string, decimals: number): number => {
  if (!value || decimals < 0) return 0;

  const trimmedValue = value.trim();
  if (!/^-?\d*(?:\.\d*)?$/.test(trimmedValue)) return 0;

  const dotIndex = trimmedValue.indexOf('.');
  if (dotIndex === -1) {
    return Number(trimmedValue) * 10 ** decimals;
  }

  const integerPart = trimmedValue.slice(0, dotIndex) || '0';
  const decimalPart = trimmedValue.slice(dotIndex + 1);
  const truncatedDecimal = decimalPart.slice(0, decimals);
  const paddedDecimal = truncatedDecimal.padEnd(decimals, '0');

  const result = integerPart + paddedDecimal;
  return Number(result);
};

export const fromMinorUnit = (
  amount: bigint | number,
  decimals: number,
): string => {
  if (decimals < 0) return '0';
  if (decimals === 0) return amount.toString();

  const amountStr = amount.toString();
  if (amountStr === '0') return '0.' + '0'.repeat(decimals);

  const isNegative = amountStr.startsWith('-');
  const absAmountStr = isNegative ? amountStr.slice(1) : amountStr;

  if (absAmountStr.length <= decimals) {
    const paddedAmount = absAmountStr.padStart(decimals, '0');
    return `${isNegative ? '-' : ''}0.${paddedAmount}`;
  }

  const splitPoint = absAmountStr.length - decimals;
  const intPart = absAmountStr.slice(0, splitPoint);
  const decimalPart = absAmountStr.slice(splitPoint);

  return `${isNegative ? '-' : ''}${intPart}.${decimalPart}`;
};

export interface PriceListEntry {
  amount: number;
  currencyCode: string;
  countryCode: string;
  isTaxable?: boolean | null;
  isNetPrice?: boolean | null;
  minQuantity?: number | null;
}

const decimalsOf = (
  currencies: { isoCode: string; decimals?: number | null }[],
  currencyCode: string,
) =>
  currencies.find(
    ({ isoCode }) => isoCode.toLowerCase() === currencyCode?.toLowerCase(),
  )?.decimals ?? 2;

export const toPricingFormValues = (
  prices: PriceListEntry[] = [],
  currencies = [],
) =>
  prices.map(
    ({
      amount,
      currencyCode,
      countryCode,
      isTaxable,
      isNetPrice,
      minQuantity,
    }) => ({
      countryCode,
      currencyCode,
      isTaxable: !!isTaxable,
      isNetPrice: !!isNetPrice,
      amount: fromMinorUnit(amount, decimalsOf(currencies, currencyCode)),
      minQuantity: minQuantity ?? '',
    }),
  );

export const toPricingInput = (rows = [], currencies = []): PriceListEntry[] =>
  rows.map(
    ({
      amount,
      currencyCode,
      countryCode,
      isTaxable,
      isNetPrice,
      minQuantity,
    }) => ({
      currencyCode,
      countryCode,
      isTaxable: !!isTaxable,
      isNetPrice: !!isNetPrice,
      amount: toMinorUnit(
        String(amount ?? ''),
        decimalsOf(currencies, currencyCode),
      ),
      ...(minQuantity !== '' &&
        minQuantity !== null &&
        minQuantity !== undefined && { minQuantity: Number(minQuantity) }),
    }),
  );
