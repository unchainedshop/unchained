import * as R from 'ramda';

export default (tree) => {
  const zipped = R.pipe(R.flatten, R.filter(Boolean))(tree);
  return zipped;
};
