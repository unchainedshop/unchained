import {  DeliveryFreePrice } from '../src/pricing/free-delivery';


describe("DeliveryFreePrice", () => {

  it('should return true', () => {
    expect(DeliveryFreePrice.isActivatedFor()).toBeTruthy();
  
  });

})
