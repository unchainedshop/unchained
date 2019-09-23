export default {
  activePickUpLocation(obj) {
    const { orderPickUpLocationId } = obj.context || {};
    return obj.provider().run('pickUpLocationById', orderPickUpLocationId);
  },
  pickUpLocations(obj) {
    return obj.provider().run('pickUpLocations');
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  }
};
