import {
  DeliveryAdapter,
  DeliveryDirector
} from "meteor/unchained:core-delivery";

import {
  MessagingDirector,
  MessagingType
} from "meteor/unchained:core-messaging";

class SendMail extends DeliveryAdapter {
  static key = "shop.unchained.send-mail";

  static label = "Send E-Mail to central Address";

  static version = "1.0";

  static initialConfiguration = [
    { key: "from", value: "" },
    { key: "to", value: "" },
    { key: "cc", value: "" }
  ];

  static typeSupported(type) {
    return type === "SHIPPING";
  }

  isActive() { // eslint-disable-line
    return true;
  }

  async estimatedDeliveryThroughput() { // eslint-disable-line
    return 0;
  }

  getFromAddress() {
    return this.config.reduce((current, item) => {
      if (item.key === "from") return item.value;
      return current;
    }, null);
  }

  getToAddress() {
    return this.config.reduce((current, item) => {
      if (item.key === "to") return item.value;
      return current;
    }, null);
  }

  getCCAddress() {
    return this.config.reduce((current, item) => {
      if (item.key === "cc") return item.value;
      return current;
    }, null);
  }

  configurationError() { // eslint-disable-line
    return null;
  }

  async send() {
    const { delivery, order } = this.context;
    const attachments = [];
    const deliveryNote = order.document({ type: "DELIVERY_NOTE" });
    if (deliveryNote) attachments.push(deliveryNote);
    if (order.payment().isBlockingOrderFullfillment()) {
      const invoice = order.document({ type: "INVOICE" });
      if (invoice) attachments.push(invoice);
    } else {
      const receipt = order.document({ type: "RECEIPT" });
      if (receipt) attachments.push(receipt);
    }

    const director = new MessagingDirector({
      ...this.context,
      type: MessagingType.EMAIL
    });

    const items = order.items().map(position => {
      const product = position.product();
      const texts = product.getLocalizedTexts();
      const pricing = position.pricing();
      const unitPrice = pricing.unitPrice().amount;
      return {
        sku: product.warehousing && product.warehousing.sku,
        name: texts.title,
        price: unitPrice / 100,
        quantity: position.quantity
      };
    });

    return director.sendMessage({
      template: "shop.unchained.send-mail",
      attachments,
      meta: {
        mailPrefix: `${order.orderNumber}_`,
        from: this.getFromAddress(),
        to: this.getToAddress(),
        cc: this.getCCAddress(),
        ...((delivery && delivery.address) || {}),
        items
      }
    });
  }
}

DeliveryDirector.registerAdapter(SendMail);
