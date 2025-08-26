import { Context } from '../../../../context.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getUserEnrollments(context: Context, params: Params<'GET_ENROLLMENTS'>) {
  const { modules } = context;
  const { userId, sort, queryString, status, limit = 10, offset = 0 } = params;

  const enrollments = await modules.enrollments.findEnrollments({
    userId,
    queryString,
    status,
    offset,
    limit,
    sort,
  } as any);

  const normalizedEnrollments = await Promise.all(
    enrollments.map(async ({ productId, ...enrollment }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...enrollment,
    })),
  );
  return { enrollments: normalizedEnrollments };
}
