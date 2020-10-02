import { Mongo } from 'meteor/mongo';

export const WarehousingProviders = new Mongo.Collection(
  'warehousing-providers'
);

export default WarehousingProviders;
