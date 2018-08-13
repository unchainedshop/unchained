import {
  DeliveryAdapter,
  DeliveryDirector,
} from 'meteor/unchained:core-delivery';

class Post extends DeliveryAdapter {
  static key = 'ch.publicare.navision.delivery'

  static label = 'Publicare Delivery'

  static version = '1.0'

  static initialConfiguration = [
  ]
  isActive() { // eslint-disable-line
    return true;
  }
  static typeSupported(type) {  // eslint-disable-line
    return true;
  }
  configurationError() { // eslint-disable-line
    return null;
  }

  async estimatedDeliveryThroughput() { // eslint-disable-line
    return 0;
  }
}

DeliveryDirector.registerAdapter(Post);
