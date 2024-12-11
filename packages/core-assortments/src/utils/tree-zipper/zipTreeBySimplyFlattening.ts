import { Tree } from '@unchainedshop/utils';
import flatten from 'ramda/es/flatten';
import filter from 'ramda/es/filter';
import pipe from 'ramda/es/pipe';

export default (tree: Tree<string>): Array<string> => {
  const zipped = pipe(flatten, filter(Boolean))(tree);
  return zipped;
};
