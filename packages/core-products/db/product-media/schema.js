import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';

import {
  ProductMedia,
  ProductMediaTexts,
  ProductMediaObject,
} from './collections';

ProductMediaObject.attachSchema(
  new SimpleSchema(
    {
      putURL: { type: String, required: true },
      url: { type: String },
      originalFileName: { type: String, required: true },
      expires: { type: Date, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

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
    { requiredByDefault: false }
  )
);

ProductMediaTexts.attachSchema(
  new SimpleSchema(
    {
      productMediaId: {
        type: String,
        required: true,
      },
      locale: String,
      authorId: { type: String, required: true },
      title: String,
      subtitle: String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  ProductMedia.rawCollection().createIndex({ mediaId: 1 });
  ProductMedia.rawCollection().createIndex({ productId: 1 });
  ProductMedia.rawCollection().createIndex({ tags: 1 });

  ProductMediaTexts.rawCollection().createIndex({ productMediaId: 1 });
  ProductMediaTexts.rawCollection().createIndex({ locale: 1 });
  ProductMediaObject.rawCollection().createIndex({
    created: -1,
  });
};
