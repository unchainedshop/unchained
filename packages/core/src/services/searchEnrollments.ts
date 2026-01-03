import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { EnrollmentQuery } from '@unchainedshop/core-enrollments';

export async function searchEnrollmentsService(
  this: Modules,
  queryString?: string,
  query: EnrollmentQuery = {},
  options: { locale?: Intl.Locale; userId?: string } = {},
) {
  if (!queryString) {
    return this.enrollments.findEnrollments(query);
  }

  const searchActions = SearchDirector.actions(
    { queryString, locale: options.locale, userId: options.userId },
    { modules: this },
  );
  const searchEnrollmentIds = await searchActions.searchEnrollments();
  if (searchEnrollmentIds.length === 0) return [];

  return this.enrollments.findEnrollments({ ...query, searchEnrollmentIds });
}
