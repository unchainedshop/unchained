import { Root, Context } from '@unchainedshop/types/api';

// we don't log this query because of reasons ;)
export default function logsCount(root: Root, _: any, { modules }: Context) {
  return modules.logs.count();
}
