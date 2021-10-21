import { Filters } from 'meteor/unchained:core-filters';

export default async function removeFilter(payload, { logger }) {
  const { _id } = payload;
  logger.debug('remove filter');
  Filters.removeFilter({ filterId: _id });
}
