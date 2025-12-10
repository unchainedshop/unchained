import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function countQuotations(context: Context, params: Params<'COUNT'>) {
  const { modules } = context;

  return modules.quotations.count(params);
}
