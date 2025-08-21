import { Context } from '../../../../context.js';
import { FilterNotFoundError } from '../../../../errors.js';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.js';
import { Params } from '../schemas.js';

export default async function getFilter(context: Context, params: Params<'GET'>) {
  const { filterId } = params;

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  if (!normalizedFilter) {
    throw new FilterNotFoundError({ filterId });
  }
  return { filter: normalizedFilter };
}
