import { ProductPrice } from '../src/pricing/product-catalog-price';
import {jest} from '@jest/globals'
import {IProductPricingSheet} from '@unchainedshop/types/products.pricing'


describe('ProductPrice.calculate()', () => {
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

  it('should add the product price to the pricing sheet and return ProductPricingCalculation array when a product has price for context ', async () => {
    const context: any = {
      country: 'CH',
      currency: 'CHF',
      product,
      quantity: 2,
      modules,
      services,
    };
    let calculationSheet: any
    const { calculate } = ProductPrice.actions({ context, calculationSheet, discounts: [] });
    const result  = await calculate()
    expect(result).toEqual([{"amount": 60, "category": "ITEM", "isNetPrice": false, "isTaxable": true, "meta": {"adapter": "shop.unchained.pricing.product-price"}}])
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
  let calculationSheet: any
  const { calculate } = ProductPrice.actions({ context, calculationSheet, discounts: [] });

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
    let calculationSheet: any
    const { resultSheet, calculate } = ProductPrice.actions({ context, calculationSheet, discounts: [] });
    expect(resultSheet().calculation).toEqual([])
    await calculate()
    expect(resultSheet().calculation).toEqual([
      {
        category: 'ITEM',
        amount: 60,
        isTaxable: true,
        isNetPrice: false,
        meta: {
                 "adapter": "shop.unchained.pricing.product-price",
               }
      }
    ])
    
});
})

