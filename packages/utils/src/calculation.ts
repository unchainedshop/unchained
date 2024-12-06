export const roundToNext = (value: number, precision: number) =>
  Math.ceil(value / precision) * precision;

export const calculateAmountToSplit = (
  configuration: { rate?: number; fixedRate?: number },
  amount: number,
) => {
  const deductionAmount = configuration.rate
    ? amount * configuration.rate
    : Math.min(configuration.fixedRate, amount);

  const leftInDiscount = Math.max(0, deductionAmount);
  return leftInDiscount;
};

export const applyRate = (configuration: { fixedRate?: number; rate?: number }, amount) => {
  const { rate, fixedRate } = configuration;
  return rate ? amount * rate : Math.min(fixedRate || 0, amount);
};

export const getTaxAmount = (total: number, rate: number, isNetPrice: boolean) => {
  return isNetPrice ? total * rate : total - total / (1 + rate);
};

export const resolveAmountAndTax = (
  { ratio, taxDivisor }: { ratio?: number; taxDivisor?: number },
  amount: number,
) => {
  const shareAmount = Number.isFinite(ratio) ? amount * ratio : 0;
  const shareTaxAmount =
    Number.isFinite(taxDivisor) && taxDivisor !== 0 ? shareAmount - shareAmount / taxDivisor : 0;
  return [shareAmount, shareTaxAmount];
};

export const applyDiscountToMultipleShares = (shares, amount) => {
  return shares.reduce(
    ([currentDiscountAmount, currentTaxAmount], share) => {
      const [shareAmount, shareTaxAmount] = resolveAmountAndTax(share, amount);
      return [currentDiscountAmount + shareAmount, currentTaxAmount + shareTaxAmount];
    },
    [0, 0],
  );
};
