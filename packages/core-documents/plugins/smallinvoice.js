import { HTTP } from 'meteor/http';
import moment from 'moment';
import {
  DocumentDirector,
  DocumentAdapter,
} from 'meteor/unchained:core-documents';

const { SMALLINVOICE_TOKEN, LANG } = process.env;

class SmallinvoiceAPI {
  static Status = {
    SENT: 1,
    DRAFT: 7,
    PAID: 2,
  };

  static Units = {
    PIECE: 7,
    DISCOUNT: 17,
  };

  static ItemType = {
    SERVICE: 1,
    PRODUCT: 2,
  };

  constructor({
    endpoint = 'https://api.smallinvoice.com',
    token,
    language,
    logger,
  }) {
    this.endpoint = endpoint;
    this.token = token;
    this.language = language;
    this.logger = logger;

    const {
      data: { items, error },
    } = this.get('/client/list');
    if (error) throw new Error(error);
    this.clientMap = (items || []).reduce((oldObj, { notes, id }) => {
      const newObj = oldObj;
      if (notes) newObj[notes] = id;
      return newObj;
    }, {});
  }

  post(path, options) {
    const url = this.url(path);
    this.logger(`Smallinvoice -> POST: ${url}`);
    return HTTP.call('POST', url, options);
  }

  get(path, options) {
    const url = this.url(path);
    this.logger(`Smallinvoice -> GET: ${url}`);
    return HTTP.call('GET', url, options);
  }

  postAsync(path, options) {
    const url = this.url(path);
    this.logger(`Smallinvoice -> POST (async): ${url}`);
    return HTTP.call('POST', url, options, (result, error) => {
      this.logger(result, error);
    });
  }

  url(path) {
    return `${this.endpoint}${path}/token/${this.token}`;
  }

  mapPositions(positions) {
    return positions.map(
      ({ name, description, price, quantity, vat, number }) => ({
        type: this.constructor.ItemType.PRODUCT,
        number,
        name,
        description,
        cost: price,
        unit: this.constructor.Units.PIECE,
        amount: quantity,
        vat,
        discount: null,
      }),
    );
  }

  mapDiscounts(discounts) {
    return discounts.map(
      ({ name, description = '', price, quantity, vat, number }) => ({
        type: this.constructor.ItemType.PRODUCT,
        number,
        name,
        description,
        cost: price,
        unit: this.constructor.Units.DISCOUNT,
        amount: quantity,
        vat,
        discount: null,
      }),
    );
  }

  upsertClient({
    userId,
    firstName,
    lastName,
    company,
    emailAddress,
    telNumber,
    addressLine,
    postalCode,
    city,
    countryCode,
  }) {
    const mappedBody = {
      data: {
        type: 1,
        name: `${firstName || ''} ${lastName || ''}`,
        email: emailAddress,
        phone: telNumber,
        addition: company,
        language: this.language,
        notes: userId,
        addresses: [
          {
            street: addressLine,
            streetno: '',
            code: postalCode,
            city,
            country: countryCode,
          },
        ],
      },
    };
    const clientId = this.clientMap[userId];
    if (clientId) {
      const { data: editResult } = this.post(
        `/client/edit/id/${clientId}`,
        mappedBody,
      );
      if (editResult.error) throw new Error(editResult.error);
      return clientId;
    }
    const { data: addResult } = this.post('/client/add', mappedBody);
    if (addResult.error) throw new Error(addResult.error);
    this.clientMap[userId] = addResult.id;
    return addResult.id;
  }

  addConfirmation({
    clientId,
    currency,
    title,
    date,
    positions,
    discounts,
    number,
  }) {
    const {
      data: { error, id },
    } = this.post('/confirmation/add', {
      data: {
        number,
        client_id: clientId,
        currency,
        title,
        date,
        language: this.language,
        vat_included: 1,
        positions: [
          ...this.mapPositions(positions),
          ...this.mapDiscounts(discounts),
        ],
      },
    });
    if (error) throw new Error(error);
    return id;
  }

  setConfirmationStatus(confirmationId, status) {
    this.postAsync(`/confirmation/status/id/${confirmationId}`, {
      data: {
        status,
      },
    });
  }

  addReceipt({
    clientId,
    currency,
    title,
    date,
    positions,
    discounts,
    number,
    introduction,
  }) {
    const {
      data: { error, id },
    } = this.post('/receipt/add', {
      data: {
        introduction,
        number,
        client_id: clientId,
        currency,
        title,
        date,
        language: this.language,
        vat_included: 1,
        positions: [
          ...this.mapPositions(positions),
          ...this.mapDiscounts(discounts),
        ],
      },
    });
    if (error) throw new Error(error);
    return id;
  }

  setReceiptStatus(receiptId, status) {
    this.postAsync(`/receipt/status/id/${receiptId}`, {
      data: {
        status,
      },
    });
  }

  addInvoice({
    clientId,
    currency,
    title,
    date,
    due,
    positions,
    discounts,
    number,
    introduction,
  }) {
    const {
      data: { error, id },
    } = this.post('/invoice/add', {
      data: {
        introduction,
        number,
        client_id: clientId,
        currency,
        title,
        date,
        due,
        language: this.language,
        vat_included: 1,
        esr: 0,
        positions: [
          ...this.mapPositions(positions),
          ...this.mapDiscounts(discounts),
        ],
      },
    });
    if (error) throw new Error(error);
    return id;
  }

  setInvoiceStatus(invoiceId, status) {
    this.postAsync(`/invoice/status/id/${invoiceId}`, {
      data: {
        status,
      },
    });
  }
}

class Smallinvoice extends DocumentAdapter {
  static key = 'shop.unchained.smallinvoice';

  static label = 'Smallinvoice';

  static version = '1.0';

  static isActivatedFor() {
    if (!SMALLINVOICE_TOKEN) return false;
    return true;
  }

  constructor(data) {
    super(data);
    const { user } = this.context;
    const language = user && user.language();
    this.language = language.isoCode || LANG;
    this.api = new SmallinvoiceAPI({
      token: SMALLINVOICE_TOKEN,
      language: this.language,
      logger: this.log,
    });
  }

  buildItems() {
    const { order } = this.context;
    return order.items().map((position) => {
      const product = position.product();
      const texts = product.getLocalizedTexts(this.language);
      const pricing = position.pricing();
      const unitPrice = pricing.unitPrice().amount;
      const tax = pricing.taxSum();
      const gross = pricing.gross();
      const taxRate = (gross / (gross - tax) - 1) * 100;
      return {
        number: product.warehousing && product.warehousing.sku,
        name: texts.title,
        description: texts.subtitle,
        price: unitPrice / 100,
        quantity: position.quantity,
        vat: Math.round(taxRate * 10000) / 10000,
      };
    });
  }

  buildDiscounts() { // eslint-disable-line
    const { order } = this.context;
    const pricing = order.pricing();
    let itemsTax = 0;
    order.items().forEach((position) => {
      itemsTax += position.pricing().taxSum();
    });
    const discounts = pricing.discountSum();
    if (discounts !== 0) {
      // cheat on the taxrate
      const tax = pricing.taxSum();
      const discountsTax = tax - itemsTax;
      const taxRate = discountsTax / (discounts - discountsTax);
      return [
        {
          number: null,
          name: 'Specials / Discounts',
          price: discounts / 100,
          quantity: 1,
          vat: Math.round(taxRate * 100 * 10000) / 10000,
        },
      ];
    }
    return [];
  }

  async buildInvoiceAndReceipt({ date, payment, orderNumber, ancestors }) {
    if (ancestors && ancestors.length > 0) {
      const oldInvoiceId = (ancestors[0].meta || {}).referenceId;
      if (oldInvoiceId) {
        if (payment.status === 'PAID') {
          this.api.setInvoiceStatus(oldInvoiceId, SmallinvoiceAPI.Status.PAID);
        } else {
          this.api.setInvoiceStatus(oldInvoiceId, SmallinvoiceAPI.Status.SENT);
        }
        return null;
      }
    }

    const { order } = this.context;
    const clientId = this.api.upsertClient({
      ...order.contact,
      ...(order.billingAddress || {}),
      userId: order.userId,
    });
    const positions = this.buildItems();
    const discounts = this.buildDiscounts();
    const number = orderNumber || order.orderNumber;
    this.log(`Smallinvoice -> Build Invoice and Receipt ${number}`);

    if (!number) {
      this.log('Smallinvoice -> No OrderNumber provided, skipping');
      return false;
    }
    const invoiceId = this.api.addInvoice({
      number,
      clientId,
      date: moment(date).format('YYYY-MM-DD'),
      due: moment(date).add(30, 'days').format('YYYY-MM-DD'),
      currency: order.currency,
      positions,
      discounts,
    });

    if (payment.status === 'PAID') {
      this.api.setInvoiceStatus(invoiceId, SmallinvoiceAPI.Status.PAID);
    } else {
      this.api.setInvoiceStatus(invoiceId, SmallinvoiceAPI.Status.SENT);
    }

    return [
      {
        file: this.api.url(`/invoice/pdf/id/${invoiceId}`),
        meta: { referenceId: invoiceId },
        fileName: 'invoice.pdf',
      },
      {
        file: this.api.url(`/invoice/pdf/receipt/1/id/${invoiceId}`),
        meta: { referenceId: invoiceId },
        fileName: 'receipt.pdf',
      },
    ];
  }

  async buildDeliveryNote({ date, delivery, orderNumber, ancestors }) {
    const { order } = this.context;

    if (ancestors && ancestors.length > 0) {
      const oldReceiptId = (ancestors[0].meta || {}).referenceId;
      if (oldReceiptId) {
        this.api.setReceiptStatus(oldReceiptId, SmallinvoiceAPI.Status.SENT);
        return null;
      }
    }

    const clientId = this.api.upsertClient({
      ...order.contact,
      ...(delivery.context.address || order.billingAddress || {}),
      countryCode: order.countryCode,
      userId: order.userId,
    });
    const positions = this.buildItems();
    const discounts = this.buildDiscounts();
    const number = orderNumber || order.orderNumber;
    this.log(`Smallinvoice -> Build Delivery Note ${number}`);
    if (!number) {
      this.log('Smallinvoice -> No OrderNumber provided, skipping');
      return false;
    }

    const receiptId = this.api.addReceipt({
      number,
      clientId,
      date: moment(date).format('YYYY-MM-DD'),
      currency: order.currency,
      positions,
      discounts,
    });

    if (delivery.status === 'DELIVERED') {
      this.api.setReceiptStatus(receiptId, SmallinvoiceAPI.Status.SENT);
    }

    return {
      file: this.api.url(`/receipt/pdf/id/${receiptId}`),
      meta: { referenceId: receiptId },
      fileName: 'delivery_note.pdf',
    };
  }

  async buildOrderConfirmation({ date, orderNumber }) {
    const { order } = this.context;
    const clientId = this.api.upsertClient({
      ...order.contact,
      ...(order.billingAddress || {}),
      userId: order.userId,
    });
    const positions = this.buildItems();
    const discounts = this.buildDiscounts();
    const number = orderNumber || order.orderNumber;
    this.log(`Smallinvoice -> Build Order Confirmation ${number}`);
    if (!number) {
      this.log('Smallinvoice -> No OrderNumber provided, skipping');
      return false;
    }
    const confirmationId = this.api.addConfirmation({
      number,
      clientId,
      date: moment(date).format('YYYY-MM-DD'),
      currency: order.currency,
      positions,
      discounts,
    });

    this.api.setConfirmationStatus(confirmationId, SmallinvoiceAPI.Status.SENT);

    return {
      file: this.api.url(`/confirmation/pdf/id/${confirmationId}`),
      meta: { referenceId: confirmationId },
      fileName: 'confirmation.pdf',
    };
  }
}

DocumentDirector.registerAdapter(Smallinvoice);
