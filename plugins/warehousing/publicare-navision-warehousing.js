import {
  WarehousingDirector,
  WarehousingAdapter,
} from 'meteor/unchained:core-warehousing';

import navision from '../../connectors/navision';

const {
  NODE_ENV,
} = process.env;

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

  async productionTime(quantity) {
    // const {
    //   product,
    // } = this.context;
    // const { sku } = product.warehousing || {};
    // if (!sku) return null;
    // const selector = 'WAREHOUSE_HOURS';
    // const timeInHours = await this.getRemoteTime(sku.toUpperCase(), quantity, selector);
    // if (!timeInHours) return null;
    return 1 * 60 * 60 * 1000;
  }

  async commissioningTime(quantity) {
    // const {
    //   product,
    //   deliveryProvider,
    // } = this.context;
    // const { sku } = product.warehousing || {};
    // const { type } = deliveryProvider;
    // const selector = `DELIVERY_HOURS:${type}`;
    // const timeInHours = await this.getRemoteTime(sku.toUpperCase(), quantity, selector);
    // if (!timeInHours) return null;
    return 1 * 60 * 60 * 1000;
  }
}

WarehousingDirector.registerAdapter(PublicareWarehouse);
