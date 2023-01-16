import {  PaymentFreePrice } from '../src/pricing/free-payment';


describe("PaymentFreePrice", () => {

  it('should return true', () => {
    expect(PaymentFreePrice.isActivatedFor()).toBeTruthy();
  
  });

    it('should have the correct properties', () => {
      
      const props = {
        key: 'shop.unchained.pricing.payment-free',
        label: 'Free Payment',
        version: '1.0.0',
        orderIndex: 0,
        isActivatedFor: expect.any(Function),
        actions: expect.any(Function),
        };
      expect(PaymentFreePrice).toMatchObject(props);
      
    });
    
})
