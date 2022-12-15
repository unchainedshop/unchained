import { jest } from '@jest/globals';
import { ProductPricingCalculation } from '@unchainedshop/types/products.pricing';
import { ProductPriceRateConversion } from '../src/pricing/product-price-rateconversion';

describe('ProductPriceRateConversion', () => {
  describe('calculate', () => {
    const product: any = {
      id: 'abc123',
      name: 'Test Product',
      price: {
        amount: 100,
        currencyCode: 'CHF',
        isTaxable: true,
        isNetPrice: false,
      },
    };

    const context: any = {
      country: 'CH',
      currency: 'EUR',
      product,
      quantity: 2,
      configuration: [],
      modules: {
        products: {
          prices: {
            price: jest.fn((prod: any, {country}) => {
              if(country !== 'CH' )
              return null
              return prod.price
            }),
            rates: {
              getRate: jest.fn((_, target: any) => {
              
                if(target.isoCode === 'EUR')
                return {
                baseCurrency: 'CHF',
                quoteCurrency: 'EUR',
                rate: .9,
                expiresAt: new Date(),
                timestamp: new Date(),
              }
              if(target.isoCode === 'USD')
                return {
                baseCurrency: 'CHF',
                quoteCurrency: 'EUR',
                rate: 0,
                expiresAt: new Date(),
                timestamp: new Date(),
              }

            return null
            }),
            },
          },
        },
        currencies: {
          findCurrency: jest.fn(({isoCode}) => ({ isoCode, isActive: isoCode !== 'in-active'})),
        },
      },
    };

    const CalculationITEM: ProductPricingCalculation = { category: 'ITEM', amount: 100, isNetPrice: false, isTaxable: true };
      
      const calculations: ProductPricingCalculation[] = [CalculationITEM];



    const calculationSheet: any = {
      calculation: [],
      currency: 'CHF',
      quantity: 2,
      isValid: jest.fn(() => true),
      gross: jest.fn(() => 180),
      net: jest.fn(() => 180),
      sum: jest.fn(() => 0),
      taxSum: jest.fn(() => 0),
      total: jest.fn(() => ({ amount: 180, currency: 'EUR' })),
      filterBy: jest.fn((filter) => {
        if(filter === 'ITEM')
      return  calculations
      return []
      }),

    };

    

    it('converts the product price to the target currency using the exchange rate', async () => {
      const actions = ProductPriceRateConversion.actions({ context, calculationSheet, discounts: [] });
      await actions.calculate();
      expect(actions.resultSheet().getRawPricingSheet()).toEqual([
        {
          category: 'ITEM',
          amount: 180,
          isTaxable: true,
          isNetPrice: false,
          meta: { adapter: 'shop.unchained.pricing.rate-conversion', rate: .9 },
        },
      ]);
    });

    it('return empty array when a product does not have price item for the context', async () => {
      const actions = ProductPriceRateConversion.actions({ context:{...context, country: 'US'}, calculationSheet, discounts: [] });
      await actions.calculate();
      expect(actions.resultSheet().getRawPricingSheet()).toEqual([]);
    }); 

    it('return empty array when a product does not have price item for the context', async () => {
      const actions = ProductPriceRateConversion.actions({ context:{...context, country: 'US'}, calculationSheet, discounts: [] });
      
      expect(await actions.calculate()).toEqual([]);
    }); 

    it('return empty array when a product does not have price item for the context', async () => {          
      const actions = ProductPriceRateConversion.actions({ context, calculationSheet: {...calculationSheet, calculation: calculations}, discounts: [] });
      expect(await actions.calculate()).toEqual([]);
    }); 

    it('return empty array when a target currency rate is below 1 does not have price item for the context', async () => {          
      const actions = ProductPriceRateConversion.actions({ context:{...context, currency: 'USD'}, calculationSheet, discounts: [] });
      expect(await actions.calculate()).toEqual([]);
    }); 

    it('return empty array when a target currency is does not have a rate', async () => {          
      const actions = ProductPriceRateConversion.actions({ context:{...context, currency: 'ETB'}, calculationSheet, discounts: [] });
      expect(await actions.calculate()).toEqual([]);
    }); 

    it('return empty array when a target currency is not active', async () => {          
      const actions = ProductPriceRateConversion.actions({ context:{...context, currency: 'in-active'}, calculationSheet, discounts: [] });
      expect(await actions.calculate()).toEqual([]);
    }); 
  });
});
