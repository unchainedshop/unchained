import { ProductPricingSheet } from "./ProductPricingSheet.js";


const TAX = { category: 'TAX', amount: 50, isNetPrice: false, isTaxable: false };
const TAX2 = { category: 'TAX', amount: 25, isNetPrice: false, isTaxable: false };
const DISCOUNT = { category: 'DISCOUNT', amount: 20, isNetPrice: false, isTaxable: false, discountId: 'for-all'  };
const DISCOUNT2 = { category: 'DISCOUNT', amount: 20, isNetPrice: false, isTaxable: false, discountId: 'for-all'  };
const DISCOUNT3 = { category: 'DISCOUNT', amount: 20, isNetPrice: false, isTaxable: false, discountId: 'special'  };
const ITEM1 = { category: 'ITEM', amount: 200, isNetPrice: true, isTaxable: false };
const ITEM2 = { category: 'ITEM', amount: 200, isNetPrice: true, isTaxable: false };
const calculations = [TAX, TAX2, DISCOUNT, DISCOUNT2, DISCOUNT3, ITEM1, ITEM2];

describe('ProductPricingSheet', () => {
    let pricingSheet

    const pricingSheetParams = {
        calculation:  calculations,
        currency: 'CHF',
        quantity: 2,
      };
      beforeEach(() => {
        pricingSheet = ProductPricingSheet(pricingSheetParams);
      })
      
    it('should return an object that implements the IProductPricingSheet interface', () => {
        expect(pricingSheet).toBeDefined();
        expect(pricingSheet.quantity).toEqual(2);
        expect(pricingSheet.currency).toEqual('CHF');
        expect(typeof pricingSheet.addItem).toBe('function');
        expect(typeof pricingSheet.addDiscount).toBe('function');
        expect(typeof pricingSheet.addTax).toBe('function');
        expect(typeof pricingSheet.taxSum).toBe('function');
        expect(typeof pricingSheet.discountSum).toBe('function');
        expect(typeof pricingSheet.unitPrice).toBe('function');
        expect(typeof pricingSheet.discountPrices).toBe('function');
        expect(typeof pricingSheet.getDiscountRows).toBe('function');
      });

      it('gross() should return the GROSS sum of all ProductPricingCalculation', () => {
        expect(pricingSheet.gross()).toEqual(535)
      })

      it('net() should return the NET sum of all ProductPricingCalculation (i.e before TAX)', () => {
        expect(pricingSheet.net()).toEqual(460)
      })

      describe('total()', () => {
        it('should return sum of all ProductPricingCalculations ', () => {            
            expect(pricingSheet.total()).toEqual({"amount": 535, "currency": "CHF"})
            expect(pricingSheet.total()).toEqual({ amount: pricingSheet.gross(), currency: "CHF"})
         })

         it('should return sum of all ProductPricingCalculations ', () => {            
            expect(pricingSheet.total({useNetPrice: true})).toEqual({"amount": 460, "currency": "CHF"})
            expect(pricingSheet.total({useNetPrice: true})).toEqual({ amount: pricingSheet.net(), currency: "CHF"})
         })

         it('should return sum of all ProductPricingCalculations for the provided category ', () => {            
          expect(pricingSheet.total({category: 'ITEM'})).toEqual({"amount": 400, "currency": "CHF"})
          expect(pricingSheet.total({category: 'DISCOUNT'})).toEqual({"amount": 60, "currency": "CHF"})
          expect(pricingSheet.total({category: 'TAX'})).toEqual({"amount": 75, "currency": "CHF"})
       })
      })

      describe('isValid()', () => {
        it('should return true if there is at least 1 registered ProductPricingCalculation ', () => {            
            expect(pricingSheet.isValid()).toEqual(true)
        })
        it('should return false if there is no registered ProductPricingCalculation ', () => {    
          const sheet = ProductPricingSheet({...pricingSheetParams, calculation: []});        
          expect(sheet.isValid()).toEqual(false)
      })
      })


      describe('getRawPricingSheet', () => {
        it('should return all registered ProductPricingCalculation', () => {
            
            expect(pricingSheet.getRawPricingSheet()).toEqual(calculations)
          })

      })


      describe('getDiscountRows', () => {
        it('should return all the DISCOUNTS registered on the ProductPricingSheet', () => {
            expect(pricingSheet.getDiscountRows('for-all')).toEqual([DISCOUNT, DISCOUNT2])
          })

      })

      describe('taxSum', () => {
        it('should return the sum of TAX calculation registered on the adapter', () => {            
            expect(pricingSheet.taxSum()).toEqual(75)
          })

      })

      describe('discountSum', () => {
        it('should return the sum of DISCOUNT calculation registered on the adapter', () => {
            expect(pricingSheet.discountSum()).toEqual(60)
          })

      })

      describe('unitPrice', () => {
        it('should return the GROSS sum for a  product price useNetPrice:false', () => {            
          expect(pricingSheet.unitPrice({useNetPrice: false})).toEqual({"amount": 268, "currency": "CHF" })
        })

        it('should return the NET sum for a product price when useNetPrice:true', () => {            
          expect(pricingSheet.unitPrice({useNetPrice: true})).toEqual({"amount": 230, "currency": "CHF" })
        })
      })

      describe('discountPrices', () => {
        it('should return the sum of all discounts registered on the price sheet based on discountId', () => {            
          expect(pricingSheet.discountPrices('for-all')).toEqual([{"amount": 40, "currency": "CHF", "discountId": "for-all"}])
          expect(pricingSheet.discountPrices('special')).toEqual([{"amount": 20, "currency": "CHF", "discountId": "special"}])
        })

        it('should return empty array if discount with the provided discountId is not found', () => {            
          expect(pricingSheet.discountPrices('non-existing')).toEqual([])
        })

      })

      describe('addDiscount', () => {
        it('should add ProductPricingCalculation DISCOUNT category successfully', () => {            
          expect(pricingSheet.getDiscountRows('new')).toEqual([])
          pricingSheet.addDiscount({amount: 300, isNetPrice: true, isTaxable: true, discountId: 'new'})
          expect(pricingSheet.getDiscountRows('new')).toEqual([{amount: 300, isNetPrice: true, isTaxable: true, category: 'DISCOUNT', meta: undefined, discountId: 'new'}])          
        })
      })
})


  