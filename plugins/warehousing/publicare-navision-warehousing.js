import {
  WarehousingDirector,
  WarehousingAdapter,
} from 'meteor/unchained:core-warehousing';

import navision from '../../connectors/navision';

class PublicareWarehouse extends WarehousingAdapter {
  static key = 'ch.publicare.navision.warehousing'

  static version = '1.0'

  static label = 'Publicare Warehousing'

  static orderIndex = 1

  static initialConfiguration = [{
    key: 'address',
    value: null,
  }]

  static typeSupported(type) {
    return (type === 'PHYSICAL');
  }

  isActive(context) { // eslint-disable-line
    return true;
  }

  configurationError() { // eslint-disable-line
    return null;
  }

  async stock(referenceDate) {
    const {
      product,
    } = this.context;
    const { sku } = product.warehousing || {};
    console.log('Navision Warehousing: get stock available quantity for', sku, referenceDate);
    return navision.getAvailableStock({
      itemNumber: sku,
      deliveryDate: referenceDate,
    });
  }

  async productionTime(quantity) { // eslint-disable-line
    return 0;
  }

  async commissioningTime(quantity) { // eslint-disable-line
    return 0;
  }
}

WarehousingDirector.registerAdapter(PublicareWarehouse);
