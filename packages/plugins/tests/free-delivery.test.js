import {  DeliveryFreePrice } from '../src/pricing/free-delivery';


describe("DeliveryFreePrice", () => {

  it('should return true', () => {
    expect(DeliveryFreePrice.isActivatedFor()).toBeTruthy();
  
  });




    it('should have the correct properties', () => {
      
      const props = {
        key: 'shop.unchained.pricing.delivery-free',
        label: 'Free Delivery',
        version: '1.0.0',
        orderIndex: 0,
        isActivatedFor: expect.any(Function),
        actions: expect.any(Function),
        };
      expect(DeliveryFreePrice).toMatchObject(props);
      
    });
    

})
