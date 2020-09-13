import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { ProductMedia, ProductMediaTexts } from './collections';

ProductMedia.attachSchema(
  new SimpleSchema(
    {
      mediaId: { type: String, required: true },
      productId: { type: String, required: true },
      sortKey: { type: Number, required: true },
      tags: Array,
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

ProductMedia.rawCollection().createIndex({ mediaId: 1 });
ProductMedia.rawCollection().createIndex({ productId: 1 });
ProductMedia.rawCollection().createIndex({ tags: 1 });

ProductMediaTexts.attachSchema(
  new SimpleSchema(
    {
      productMediaId: {
        type: String,
        required: true,
        index: true,
      },
      locale: { type: String, index: true },
      authorId: { type: String, required: true },
      title: String,
      subtitle: String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);
