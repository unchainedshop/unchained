import { HTTP } from 'meteor/http';
import convert from 'xml-js';

import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

const {
  DVACHECK_USERNAME,
  DVACHECK_PASSWORD,
} = process.env;

class DVACheckAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DVACheckAPIError';
  }
}

class DVACheckAPI {
  constructor({
    endpoint = 'https://preprodservices.crif-online.ch/dvacheck', username, password,
  }) {
    this.endpoint = endpoint;
    this.username = username || '';
    this.password = password || '';
  }
  post(path, data) {
    const dataObject = {
      elements: [{
        type: 'element',
        name: 'dvaCheckRequest',
        elements: [{
          type: 'element',
          name: 'identity',
          elements: [{
            type: 'element',
            name: 'username',
            elements: [{ type: 'text', text: this.username }],
          }, {
            type: 'element',
            name: 'password',
            elements: [{ type: 'text', text: this.password }],
          }],
        }, ...data],
      }],
    };
    const content = convert.js2xml(dataObject, { compact: false, spaces: '\t' });
    const options = {
      content,
      headers: {
        'content-type': 'text/xml; charset=utf-8',
      },
    };
    const result = HTTP.call('POST', this.url(path), options);
    return convert.xml2js(result.content, { compact: true });
  }
  url(path) {
    return `${this.endpoint}${path}`;
  }
  checkAddress(address, isCompany, reference) {
    try {
      const addressElements = Object.keys(address).map((key) => {
        const dict = {
          type: 'element',
          name: key,
          elements: [{ type: 'text', text: address[key] }],
        };
        return dict;
      });
      const data = [{
        type: 'element',
        name: 'requestType',
        elements: [{ type: 'text', text: 'CreditCheckShortV02' }],
      }];
      if (reference) {
        data.push({
          type: 'element',
          name: 'reference',
          elements: [{ type: 'text', text: reference }],
        });
      }
      data.push({
        type: 'element',
        name: isCompany ? 'private' : 'company',
        elements: addressElements,
      });
      const result = this.post('', data);
      const { dvaCheckResponse: { response } = { response: {} } } = result;
      const responseCode = (response && response.responseCode) ?
        response.responseCode._text : // eslint-disable-line
        '200';
      const responseText = (response && response.responseText)
        ? response.responseText._text : // eslint-disable-line
        '';

      if (responseCode !== '200') {
        throw new DVACheckAPIError(`${responseCode}: ${responseText}`);
      }
      return response;
    } catch (e) {
      if (e.response) {
        const code = (e.response.statusCode);
        const text = (e.response.content);
        throw new DVACheckAPIError(`${code}: ${text}`);
      }
      throw e;
    }
  }
}

class DeltavistaInvoice extends PaymentAdapter {
  static key = 'ch.freezyboy.deltavista-invoice'
  static label = 'Invoice with Deltavista DVA Check'
  static version = '1.0'
  static initialConfiguration = []

  static typeSupported(type) {
    return (type === 'INVOICE');
  }

  static getUsername() { // eslint-disable-line
    return DVACHECK_USERNAME;
  }

  static getPassword() { // eslint-disable-line
    return DVACHECK_PASSWORD;
  }

  constructor(...args) {
    super(...args);
    this.api = new DVACheckAPI({
      username: this.constructor.getUsername(),
      password: this.constructor.getPassword(),
      reference: this.context.order.userId,
    });
  }

  configurationError() {
    if (!this.constructor.getUsername() || !this.constructor.getPassword()) {
      return PaymentError.WRONG_CREDENTIALS;
    }
    return null;
  }

  isActive() { // eslint-disable-line
    if (this.configurationError() !== null) return false;
    if (!this.context.order) return false;
    const address = this.context.order.address();
    if (address.countryCode === 'CH') {
      // only for ch
      return false;
    }
    try {
      const result = this.api.checkAddress(address);
      this.log(result);
      return true;
    } catch (e) {
      return false;
    }
  }

  isPayLaterAllowed() {
    const address = this.context.order.address();
    // we know this could fail, we want that it fails if somebody that already ordered
    // has a changed solvency
    try {
      const result = this.api.checkAddress(address);
      this.log(result);
    } catch (e) {
      if (e.name === 'DVACheckAPIError') {
        throw new Error('100: Solvency check failed');
      }
    }
    return true;
  }
}

PaymentDirector.registerAdapter(DeltavistaInvoice);
