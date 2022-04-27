import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function enrollments(
  root: Root,
  params: {
    limit: number;
    offset: number;

    queryString?: string;
  },
  { modules, userId }: Context,
) {
  log(`query enrollments: ${params?.limit} ${params?.offset}`, { userId });
  const { limit, offset, queryString } = params;
  return modules.enrollments.findEnrollments({ limit, offset, queryString });
}
