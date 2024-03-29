import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const AssortmentMediaSchema = new SimpleSchema(
  {
    mediaId: { type: String, required: true },
    assortmentId: { type: String, required: true },
    sortKey: { type: Number, required: true },
    tags: Array,
    'tags.$': String,
    meta: { type: Object, blackbox: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const AssortmentMediaTextsSchema = new SimpleSchema(
  {
    assortmentMediaId: {
      type: String,
      required: true,
    },
    locale: String,
    title: String,
    subtitle: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
