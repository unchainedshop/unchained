import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { UserQuery } from '@unchainedshop/core-users';

export async function searchUsersService(
  this: Modules,
  queryString?: string,
  query: UserQuery = {},
  options: { locale?: Intl.Locale; userId?: string } = {},
) {
  if (!queryString) {
    return this.users.findUsers(query);
  }

  const searchActions = SearchDirector.actions(
    { queryString, locale: options.locale, userId: options.userId },
    { modules: this },
  );
  const searchUserIds = await searchActions.searchUsers();
  if (searchUserIds.length === 0) return [];

  return this.users.findUsers({ ...query, searchUserIds });
}

export async function searchUsersCountService(
  this: Modules,
  queryString?: string,
  query: UserQuery = {},
  options: { locale?: Intl.Locale; userId?: string } = {},
) {
  if (!queryString) {
    return this.users.count(query);
  }

  const searchActions = SearchDirector.actions(
    { queryString, locale: options.locale, userId: options.userId },
    { modules: this },
  );
  const searchUserIds = await searchActions.searchUsers();
  if (searchUserIds.length === 0) return 0;

  return this.users.count({ ...query, searchUserIds });
}
