import { Tree } from '@unchainedshop/utils';

export default (tree: Tree<string>): Array<string> => {
  return (tree as string[][]).flat(Number.MAX_SAFE_INTEGER).filter(Boolean) as Array<string>;
};
