export { default as create } from './create.js';
export { default as update } from './update.js';
export { default as remove } from './remove.js';

export { AssortmentCreatePayloadSchema } from '../assortment/create.js';
export { AssortmentUpdatePayloadSchema } from '../assortment/update.js';
export { AssortmentRemovePayloadSchema } from '../assortment/remove.js';

// z.object({
//     entity: z.literal('assortment'),
//     operation: z.literal('create'),
//     payload: AssortmentCreatePayloadSchema,
//   }),
//   z.object({
//     entity: z.literal('assortment'),
//     operation: z.literal('update'),
//     payload: AssortmentUpdatePayloadSchema,
//   }),
//   z.object({
//     entity: z.literal('assortment'),
//     operation: z.literal('remove'),
//     payload: AssortmentRemovePayloadSchema,
//   }),
