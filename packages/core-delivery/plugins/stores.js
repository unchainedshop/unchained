import {
  DeliveryAdapter,
  registerAdapter,
} from 'meteor/unchained:core-delivery';

class PickMup extends DeliveryAdapter {
  static key = 'shop.unchained.stores';

  static label = 'Manual Pickup';

  static version = '1.0';

  static initialConfiguration = [];

  // eslint-disable-next-line
  isActive() {
    return true;
  }

  static typeSupported(type) {
    return type === 'PICKUP';
  }

  // eslint-disable-next-line
  configurationError() {
    return null;
  }

  getStores() {
    return this.config.reduce((current, item) => {
      if (item.key === 'stores') return JSON.parse(item.value);
      return current;
    }, {});
  }

  // eslint-disable-next-line
  async estimatedDeliveryThroughput(warehousingThroughputTime) {
    return 0;
  }

  async pickUpLocationById(id) {
    return this.getStores().find((store) => store._id === id);
  }

  async pickUpLocations() {
    return this.getStores();
  }
}

registerAdapter(PickMup);
