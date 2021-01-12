import { Assortments } from 'meteor/unchained:core-assortments';

export default async function removeAssortment(payload, { logger }) {
  const { _id } = payload;
  logger.debug('remove assortment');
  Assortments.removeAssortment({ assortmentId: _id });
}
