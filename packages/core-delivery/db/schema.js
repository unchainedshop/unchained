import { Schemas } from "meteor/unchained:utils";
import { Migrations } from "meteor/percolate:migrations";
import SimpleSchema from "simpl-schema";
import { DeliveryProviders } from "./collections";

export const DeliveryProviderType = { // eslint-disable-line
  SHIPPING: "SHIPPING",
  PICKUP: "PICKUP"
};

DeliveryProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true, index: true },
      adapterKey: { type: String, required: true },
      configuration: { type: Array },
      "configuration.$": { type: Object },
      "configuration.$.key": { type: String },
      "configuration.$.value": { type: String },
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20181128,
  name: "Rename delivery provider keys",
  up() {
    DeliveryProviders.update(
      { adapterKey: "ch.dagobert.post" },
      {
        $set: { adapterKey: "shop.unchained.post" }
      },
      { multi: true }
    );
  },
  down() {
    DeliveryProviders.update(
      { adapterKey: "shop.unchained.post" },
      {
        $set: { adapterKey: "ch.dagobert.post" }
      },
      { multi: true }
    );
  }
});

export default () => {
  Meteor.startup(() => {
    Migrations.migrateTo("latest");
  });
};
