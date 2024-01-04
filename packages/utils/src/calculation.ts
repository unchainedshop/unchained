import { IBasePricingSheet, PricingCalculation } from '@unchainedshop/types/pricing.js';

export const roundToNext = (value: number, precision: number) =>
  Math.ceil(value / precision) * precision;

export const resolveRatioAndTaxDivisorForPricingSheet = (
  pricing: IBasePricingSheet<PricingCalculation>,
  total: number,
) => {
  if (total === 0 || !pricing) {
    return {
      ratio: 1,
      taxDivisor: 1,
    };
  }
  const tax = pricing.taxSum();
  const gross = pricing.gross();
  if (gross - tax === 0) {
    return {
      ratio: 0,
      taxDivisor: 0,
    };
  }
  return {
    ratio: gross / total,
    taxDivisor: gross / (gross - tax),
  };
};

export const calculateAmountToSplit = (
  configuration: { rate?: number; fixedRate?: number; alreadyDeducted?: number },
  amount: number,
) => {
  const deductionAmount = configuration.rate
    ? amount * configuration.rate
    : Math.min(configuration.fixedRate, amount);

  const leftInDiscount = Math.max(0, deductionAmount - (configuration.alreadyDeducted ?? 0));
  return leftInDiscount;
};

export const applyRate = (configuration: { fixedRate?: number; rate?: number }, amount) => {
  const { rate, fixedRate } = configuration;
  return rate ? amount * rate : Math.min(fixedRate || 0, amount);
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
