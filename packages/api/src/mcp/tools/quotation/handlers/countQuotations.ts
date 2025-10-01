import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function countQuotations(context: Context, params: Params<'COUNT'>) {
  const { modules } = context;

  return modules.quotations.count(params);
}
