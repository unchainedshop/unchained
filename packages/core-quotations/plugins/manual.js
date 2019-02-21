import {
  QuotationDirector,
  QuotationAdapter,
} from 'meteor/unchained:core-quotations';

class ManualOffering extends QuotationAdapter {
  static key = 'shop.unchained.quotations.manual'

  static version = '1.0'

  static label = 'Manual Offerings'

  static orderIndex = 0

  static isActivatedFor() {
    return true;
  }

  configurationError() { // eslint-disable-line
    return null;
  }

  async manualRequestVerificationNeeded() { // eslint-disable-line
    return false;
  }

  async manualProposalNeeded(context) { // eslint-disable-line
    return false;
  }

  async quote(config) { // eslint-disable-line
    return {
      price: 500,
      expires: new Date(),
    };
  }

  async rejectWithReason() { // eslint-disable-line
    return true;
  }
}

QuotationDirector.registerAdapter(ManualOffering);
