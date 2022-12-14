import { IProductPricingSheet, ProductPricingAdapterContext, ProductPricingCalculation } from '@unchainedshop/types/products.pricing';

import {ProductPricingAdapter} from '../src/director/ProductPricingAdapter'
import { Product, ProductStatus, ProductType } from '@unchainedshop/types/products';
import { ProductPricingSheet } from '../src/director/ProductPricingSheet';

const product: Product = {
  _id: '1234',
  bundleItems: [],
  proxy: {
    assignments: []
  },
  plan: {},
  commerce: {
    salesUnit: 'Each',
    salesQuantityPerUnit: '1',
    defaultOrderQuantity: 1,
    pricing: [
      {
        _id: '1',
        isTaxable: true,
        isNetPrice: false,
        countryCode: 'US',
        currencyCode: 'USD',
        amount: 49.99,
        maxQuantity: 10,
      },
    ],
  },
  meta: {
    color: 'red',
    size: 'large',
  },
  published: new Date(),
  sequence: 1,
  slugs: ['red-shirt', 'shirt-red'],
  status: ProductStatus.ACTIVE,
  supply: {
    weightInGram: 400,
    heightInMillimeters: 300,
    lengthInMillimeters: 500,
    widthInMillimeters: 100,
  },
  tags: ['shirt', 'red'],
  type: ProductType.SimpleProduct,
  warehousing: {
    baseUnit: 'Each',
    sku: '1234',
  },
  
};


const TAX: ProductPricingCalculation = { category: 'TAX', amount: 50, isNetPrice: false, isTaxable: false };
const TAX2: ProductPricingCalculation = { category: 'TAX', amount: 25, isNetPrice: false, isTaxable: false };
const DISCOUNT: ProductPricingCalculation = { category: 'DISCOUNT', amount: 20, isNetPrice: false, isTaxable: false, discountId: 'for-all'  };
const calculations: ProductPricingCalculation[] = [TAX, TAX2, DISCOUNT];


describe('ProductPricingAdapter', () => {
  let context: ProductPricingAdapterContext;
  let calculationSheet: IProductPricingSheet;

  beforeEach(() => {
    context = {
     ...context,
     country: 'CH',
        currency: 'CHF',
        product,
        quantity: 1,
        configuration: [],
    };
    calculationSheet = ProductPricingSheet({
      calculation: calculations,
      currency: 'CHF',
      quantity: 2
    });
  });

  it('isActivatedFor always returns false', () => {
    expect(ProductPricingAdapter.isActivatedFor(context)).toBe(false);
  });

  it('calculate returns an empty array', async () => {
    const actions = ProductPricingAdapter.actions({ context, calculationSheet, discounts: [] });
    const result = await actions.calculate();
    expect(result).toEqual([]);
  });

  it('resultSheet returns a ProductPricingSheet', () => {
      const actions = ProductPricingAdapter.actions({ context, calculationSheet, discounts: [] });
      const result =  actions.resultSheet() ;
      expect(result.currency).toBe('CHF');
      expect(result.quantity).toBe(1);
    
  });

  it('getCalculation returns a empty array', () => {
    const actions = ProductPricingAdapter.actions({ context, calculationSheet, discounts: [] });
    expect( actions.getCalculation() ).toEqual([]);
  
  });

  it('fetContext returns return the context of ProductPricingAdapter', () => {
    const actions = ProductPricingAdapter.actions({ context, calculationSheet, discounts: [] });
    expect( actions.getContext() ).toEqual(context);
  
  });
  
});
