import { SwissTaxCategories } from "./ch";

describe('SwissTaxCategories', () => {
    it('DEFAULT rate', () => {
      expect(SwissTaxCategories.DEFAULT.rate(new Date(2023, 1, 1))).toBe(0.077);
      expect(SwissTaxCategories.DEFAULT.rate(new Date(2024, 1, 1))).toBe(0.081);
    });
  
    it('REDUCED rate', () => {
      expect(SwissTaxCategories.REDUCED.rate(new Date(2023, 1, 1))).toBe(0.025);
      expect(SwissTaxCategories.REDUCED.rate(new Date(2024, 1, 1))).toBe(0.026);
    });
  
    it('SPECIAL rate', () => {
      expect(SwissTaxCategories.SPECIAL.rate(new Date(2023, 1, 1))).toBe(0.037);
      expect(SwissTaxCategories.SPECIAL.rate(new Date(2024, 1, 1))).toBe(0.038);
    });
  });