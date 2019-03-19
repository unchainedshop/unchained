import {
  QuotationDirector,
  QuotationAdapter,
} from 'meteor/unchained:core-quotations';

class ManualOffering extends QuotationAdapter {
  static key = 'shop.unchained.quotations.manual'

  static version = '1.0'

  static label = 'Manual Offerings'

  static orderIndex = 0

  async quote(config) { // eslint-disable-line
    return {
      expires: new Date() + (1000 * 3600) * 1000,
    };
  }
}

QuotationDirector.registerAdapter(ManualOffering);
