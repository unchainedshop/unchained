import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getFilter(context: Context, params: Params<'GET'>) {
  const { filterId } = params;

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  if (!normalizedFilter) {
    throw new FilterNotFoundError({ filterId });
  }
  return { filter: normalizedFilter };
}
