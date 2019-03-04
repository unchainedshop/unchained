import {
  DeliveryAdapter,
  DeliveryDirector
} from "meteor/unchained:core-delivery";

class Post extends DeliveryAdapter {
  static key = "shop.unchained.post";

  static label = "Post (Manual)";

  static version = "1.0";

  static initialConfiguration = [];
  isActive() { // eslint-disable-line
    return false;
  }
  static typeSupported(type) {  // eslint-disable-line
    return false;
  }
  configurationError() { // eslint-disable-line
    return null;
  }

  async estimatedDeliveryThroughput() { // eslint-disable-line
    return 0;
  }
}

DeliveryDirector.registerAdapter(Post);
