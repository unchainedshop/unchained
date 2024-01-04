const startOf2024 = new Date('2024-01-01T00:00:00.000+0100');

// https://www.estv.admin.ch/estv/en/home/value-added-tax/vat-rates-switzerland.html

export const SwissTaxCategories: Record<
  string,
  {
    value: string;
    rate: (referenceDate?: Date) => number;
  }
> = {
  DEFAULT: {
    value: 'default',
    rate: (referenceDate = new Date()) => {
      if (referenceDate.getTime() < startOf2024.getTime()) {
        return 0.077;
      }
      return 0.081;
    },
  },
  REDUCED: {
    value: 'reduced',
    rate: (referenceDate = new Date()) => {
      if (referenceDate.getTime() < startOf2024.getTime()) {
        return 0.025;
      }
      return 0.026;
    },
  },
  SPECIAL: {
    value: 'special',
    rate: (referenceDate = new Date()) => {
      if (referenceDate.getTime() < startOf2024.getTime()) {
        return 0.037;
      }
      return 0.038;
    },
  },
};
