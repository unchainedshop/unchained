import { Context } from '@unchainedshop/types/api';

export default async function removeAssortment(
  payload,
  { logger },
  unchainedAPI: Context
) {
  const { modules, userId } = unchainedAPI;
  const { _id } = payload;
  logger.debug('remove assortment');
  await modules.assortments.delete(_id, { skipInvalidation: true }, userId);
}
