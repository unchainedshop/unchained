import * as R from 'ramda';
import { Tree } from '@unchainedshop/types/common';

export default (tree: Tree<string>): Array<string> => {
  const zipped = R.pipe(R.flatten, R.filter(Boolean))(tree);
  return zipped;
};
