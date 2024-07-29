import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const ProductMediaSchema = new SimpleSchema(
  {
    mediaId: { type: String, required: true },
    productId: { type: String, required: true },
    sortKey: { type: Number, required: true },
    tags: Array,
    'tags.$': String,
    meta: { type: Object, blackbox: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const ProductMediaTextsSchema = new SimpleSchema(
  {
    productMediaId: {
      type: String,
      required: true,
    },
    locale: Intl.Locale,
    title: String,
    subtitle: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
