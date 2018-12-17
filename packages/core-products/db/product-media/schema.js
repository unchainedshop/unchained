import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { ProductMedia, ProductMediaTexts } from './collections';

ProductMedia.attachSchema(new SimpleSchema({
  mediaId: { type: SimpleSchema.RegEx.Id, required: true, index: true },
  productId: { type: SimpleSchema.RegEx.Id, required: true, index: true },
  sortKey: { type: Number, required: true },
  tags: { type: Array, index: true },
  'tags.$': String,
  meta: { type: Object, blackbox: true },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

ProductMediaTexts.attachSchema(new SimpleSchema({
  productMediaId: { type: SimpleSchema.RegEx.Id, required: true, index: true },
  locale: { type: String, index: true },
  title: String,
  subtitle: String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
