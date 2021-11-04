import { Root, Context } from 'unchained-core-types/api';

// we don't log this query because of reasons ;)
export default function logsCount(root: Root, _: any, { modules }: Context) {
  return modules.logger.count();
}
