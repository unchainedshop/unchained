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
    return true;
  }

  async manualProposalNeeded() { // eslint-disable-line
    return true;
  }

  async quote(config) { // eslint-disable-line
    return {
      expires: new Date() + (1000 * 3600),
    };
  }

  async rejectWithReason() { // eslint-disable-line
    return true;
  }
}

QuotationDirector.registerAdapter(ManualOffering);
