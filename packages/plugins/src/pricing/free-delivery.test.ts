import { DeliveryFreePrice } from "./free-delivery.js";



describe("DeliveryFreePrice", () => {

  it('should return true', () => {
    expect(DeliveryFreePrice.isActivatedFor(undefined as any)).toBeTruthy();
  
  });

})
