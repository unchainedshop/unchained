import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';

import { AssortmentMedia, AssortmentMediaTexts } from './collections';

AssortmentMedia.attachSchema(
  new SimpleSchema(
    {
      mediaId: { type: String, required: true },
      assortmentId: { type: String, required: true },
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

AssortmentMediaTexts.attachSchema(
  new SimpleSchema(
    {
      assortmentMediaId: {
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
  AssortmentMedia.rawCollection().createIndex({ mediaId: 1 });
  AssortmentMedia.rawCollection().createIndex({ assortmentId: 1 });
  AssortmentMedia.rawCollection().createIndex({ tags: 1 });

  AssortmentMediaTexts.rawCollection().createIndex({ assortmentMediaId: 1 });
  AssortmentMediaTexts.rawCollection().createIndex({ locale: 1 });
};
