export default {
  activePickUpLocation(obj) {
    const { orderPickUpLocationId } = obj.context || {};
    return obj.provider().run(
      'pickUpLocationById',
      {
        orderDelivery: obj,
      },
      orderPickUpLocationId,
    );
  },
  pickUpLocations(obj) {
    return obj.provider().run('pickUpLocations', {
      orderDelivery: obj,
    });
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  },
  discounts(obj) {
    // IMPORTANT: Do not send any parameter to obj.discounts!
    return obj.discounts();
  },
};
