import { ProductPriceRound } from '../src/pricing/product-price-round';
import {jest} from '@jest/globals'
import { ProductPricingCalculation } from '@unchainedshop/types/products.pricing';

const ITEM1: ProductPricingCalculation = { category: 'ITEM', amount: 150.4, isNetPrice: true, isTaxable: false };
const ITEM2: ProductPricingCalculation = { category: 'ITEM', amount:150.4, isNetPrice: true, isTaxable: false };
const calculations: ProductPricingCalculation[] = [ITEM1, ITEM2];


describe('ProductPriceRound.calculate()', () => {
  const product = {
    id: '123',
    prices: [
      {
        amount: 30,
        country: 'CH',
        currency: 'CHF',
        isNetPrice: false,
        isTaxable: true,
      },
    ],
  };

  const modules = {
    products: {
      prices: {
        price: jest.fn((prod: any, { country, currency, quantity }) => {
          if(country === 'CH' && currency === "CHF") {
         const [productPrice] = prod.prices
          return productPrice
          } 
          return null
        }),
      },
    },
  };

  const services = {
    countries: {
        resolveDefaultCurrencyCode: jest.fn(() => 'CHF'),
    },
  };
  let calculationSheet: any = {
    calculation: calculations,
    filterBy: jest.fn((category) => calculations.filter((c) => c.category === category)),
  }
  it('should add the product price to the pricing sheet and return ProductPricingCalculation with ROUNDED price ', async () => {
    const context: any = {
      country: 'CH',
      currency: 'CHF',
      product,
      quantity: 2,
      modules,
      services,
    };
 
    const { calculate } = ProductPriceRound.actions({ context, calculationSheet, discounts: [] });

    const result  = await calculate()
      
    expect(result).toEqual([
      {
        category: 'ITEM',
        amount: 400,
        isTaxable: false,
        isNetPrice: true,
        meta: { adapter: 'shop.unchained.pricing.price-round' }
      }
    ]
)
});

  it('should  return empty array when a product does not have price for the context', async () => {
  const context: any = {
    country: 'US',
    currency: 'USD',
    product,
    quantity: 2,
    modules,
    services,
  };
  
  const { calculate } = ProductPriceRound.actions({ context, calculationSheet: {...calculationSheet, calculation: []}, discounts: [] });

  expect(await calculate()).toEqual([])
  });


  it('should update product pricing sheet and include product price for calculation after calculation', async () => {
    const context: any = {
      country: 'CH',
      currency: 'CHF',
      product,
      quantity: 2,
      modules,
      services,
    };
  
    const { resultSheet, calculate } = ProductPriceRound.actions({ context, calculationSheet, discounts: [] });
    expect(resultSheet().calculation).toEqual([])
    await calculate()
    expect(resultSheet().calculation).toEqual([
      {
        category: 'ITEM',
        amount: 400,
        isTaxable: false,
        isNetPrice: true,
        meta: { adapter: 'shop.unchained.pricing.price-round' }
      }
    ])
    
});
})

