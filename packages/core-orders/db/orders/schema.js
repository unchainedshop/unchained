import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

import { Orders } from './collections';

const { Address, Contact, contextFields, logFields, timestampFields } = Schemas;

export const OrderStatus = {
  OPEN: null,
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FULLFILLED: 'FULLFILLED',
};

const calculationFields = {
  calculation: Array,
  'calculation.$': {
    type: Object,
    blackbox: true,
  },
};

Orders.attachSchema(
  new SimpleSchema(
    {
      userId: String,
      status: String,
      orderNumber: String,
      ordered: Date,
      confirmed: Date,
      fullfilled: Date,
      billingAddress: Address,
      contact: Contact,
      currency: String,
      countryCode: String,
      paymentId: String,
      deliveryId: String,
      originSubscriptionId: String,
      ...contextFields,
      ...timestampFields,
      ...calculationFields,
      ...logFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20200915.2,
  name: 'drop Orders related indexes',
  up() {
    Orders.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

Migrations.add({
  version: 20210525.1,
  name: 'drop Orders related indexes',
  up() {
    Orders.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

Migrations.add({
  version: 20201002,
  name: 'drop Orders related indexes',
  up() {
    Orders.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

const buildIndexes = async () => {
  Orders.rawCollection().createIndex({ userId: 1 });
  Orders.rawCollection().createIndex({ status: 1 });
  Orders.rawCollection().createIndex({ orderNumber: 1 });
  Orders.rawCollection().createIndex(
    { _id: 'text', userId: 'text', orderNumber: 'text', status: 'text' },
    {
      weights: {
        _id: 8,
        userId: 3,
        orderNumber: 6,
        status: 1,
      },
      name: 'order_fulltext_search',
    }
  );
};

export default async () => {
  try {
    await buildIndexes();
  } catch {
    await Orders.rawCollection().dropIndexes();
    try {
      await buildIndexes();
    } catch {} // eslint-disable-line
  }
};
