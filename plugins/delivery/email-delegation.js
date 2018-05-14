import moment from 'moment';

import {
  DeliveryAdapter,
  DeliveryDirector,
} from 'meteor/unchained:core-delivery';

import {
  MessagingDirector,
  MessagingType,
} from 'meteor/unchained:core-messaging';

class EmailDelegation extends DeliveryAdapter {
  static key = 'ch.freezyboy.email-delegation'
  static label = 'E-Mail Delegation'
  static version = '1.0'
  static initialConfiguration = [
    { key: 'from', value: '' },
    { key: 'to', value: '' },
    { key: 'cc', value: '' },
    { key: 'attachmentTypes', value: 'csv, documents' },
    { key: 'stockNumber', value: '10' },
    { key: 'client', value: '556688' },
  ]

  static typeSupported(type) {
    return (type === 'SHIPPING');
  }

  isActive() { // eslint-disable-line
    return true;
  }

  async estimatedDeliveryThroughput() { // eslint-disable-line
    return 0;
  }

  getFromAddress() {
    return this.config.reduce((current, item) => {
      if (item.key === 'from') return item.value;
      return current;
    }, null);
  }

  isSendAttachmentsWithType(type) {
    const types = this.config.reduce((current, item) => {
      if (item.key === 'attachmentTypes') return item.value.toLowerCase();
      return current;
    }, '');
    return types.includes(type.toLowerCase());
  }

  getToAddress() {
    return this.config.reduce((current, item) => {
      if (item.key === 'to') return item.value;
      return current;
    }, null);
  }
  getCCAddress() {
    return this.config.reduce((current, item) => {
      if (item.key === 'cc') return item.value;
      return current;
    }, null);
  }
  getStockNumber() {
    return this.config.reduce((current, item) => {
      if (item.key === 'stockNumber') return item.value;
      return current;
    }, null);
  }
  getClient() {
    return this.config.reduce((current, item) => {
      if (item.key === 'client') return item.value;
      return current;
    }, null);
  }
  generateCSV(delivery, order) {
    const lagerNr = this.getStockNumber();
    const mandant = this.getClient();
    const belegNummer = order.orderNumber;
    const dokArt = 1;
    const kundenNr = order.userId;
    const adresse1 = `${delivery.address.firstName || ''} ${delivery.address.lastName || ''}`;
    const adresse2 = delivery.address.company || '';
    const strasse1 = `${delivery.address.addressLine || ''}${delivery.address.addressLine2 || ''}`;
    const land = delivery.address.countryCode;
    const plz = delivery.address.postalCode;
    const ort = delivery.address.city;
    const belegNrBesteller = '';
    const bestelldatum = '';
    const bestellReferenz = '';
    const lieferTermin = moment().add('5', 'days').format('YYYYMMDD');
    const lieferZeitVon = '';
    const lieferZeitBis = '';
    const transportArt = '';
    const text = '';
    const losNr = '';
    const sperrCode = '';
    const reservierCode = '';

    const positions = order.items().map((item) => {
      const product = item.product();
      const artikelNr = product.warehousing ? product.warehousing.sku : product._id;
      const mengeLagereinheit = item.quantity;
      return [
        lagerNr,
        mandant,
        belegNummer,
        dokArt,
        kundenNr,
        adresse1,
        adresse2,
        strasse1,
        land,
        plz,
        ort,
        belegNrBesteller,
        bestelldatum,
        bestellReferenz,
        lieferTermin,
        lieferZeitVon,
        lieferZeitBis,
        transportArt,
        text,
        artikelNr,
        losNr,
        mengeLagereinheit,
        sperrCode,
        reservierCode,
      ].join(';');
    });

    const csvBody = `
N [ 2 ];N [ 8 ];A [ 15 ];N [ 2 ];A [ 20 ];A [ 35 ];A [ 35 ];A [ 35 ];A [ 3 ];N [ 8 ];A [ 25 ];A [ 40 ];N [ 8 ];A [ 20 ];N [ 8 ];N [ 4 ];N [ 4 ];A [ 4 ];A [ 140 ];A [ 24 ];A [ 20 ];N [ 7 ];N [ 2 ];A [ 20 ]
Lagernr.;Mandant;Belegnummer;Dok-Art;Kunde-Nr;Adresse1;Adresse2;Strasse1;Land;PLZ;Ort;BelegNr Besteller;Bestelldatum;Bestell-Referenz;Liefertermin;Lieferzeit VON;Lieferzeit BIS;Trsp.Art;Text;Artikelnummer;Losnummer;Menge LgE;Sperrcode;Reservierungscode
${positions.join('\n\r')}
    `;
    const buffer = Buffer.from(csvBody);
    return order.addDocument({
      rawFile: {
        name: 'order.csv',
        type: 'text/comma-separated-values',
        buffer,
      },
      userId: order.userId,
    });
  }
  configurationError() { // eslint-disable-line
    return null;
  }
  send() {
    const { delivery, order } = this.context;
    const attachments = [];
    if (this.isSendAttachmentsWithType('csv')) {
      const csv = this.generateCSV(delivery, order);
      if (csv) attachments.push(csv);
    } else if (this.isSendAttachmentsWithType('documents')) {
      const deliveryNote = order.document({ type: 'DELIVERY_NOTE' });
      if (deliveryNote) attachments.push(deliveryNote);
      if (order.payment().isBlockingOrderFullfillment()) {
        const invoice = order.document({ type: 'INVOICE' });
        if (invoice) attachments.push(invoice);
      } else {
        const receipt = order.document({ type: 'RECEIPT' });
        if (receipt) attachments.push(receipt);
      }
    }

    const director = new MessagingDirector({
      ...this.context,
      type: MessagingType.EMAIL,
    });

    const items = order.items().map((position) => {
      const product = position.product();
      const texts = product.getLocalizedTexts();
      const pricing = position.pricing();
      const unitPrice = pricing.unitPrice().amount;
      return {
        sku: product.warehousing && product.warehousing.sku,
        name: texts.title,
        price: unitPrice / 100,
        quantity: position.quantity,
      };
    });

    return director.sendMessage({
      template: 'ch.freezyboy.email-delegation.send',
      attachments,
      meta: {
        mailPrefix: `${order.orderNumber}_`,
        from: this.getFromAddress(),
        to: this.getToAddress(),
        cc: this.getCCAddress(),
        ...((delivery && delivery.address) || {}),
        items,
      },
    });
  }
}

DeliveryDirector.registerAdapter(EmailDelegation);
