import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';

export default async function getCurrentUser(context: Context) {
  const { user } = context;
  return { user: removeConfidentialServiceHashes(user) };
}
