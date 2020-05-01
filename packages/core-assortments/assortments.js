import './db/factories';
import './db/schema';
import treeZipper from './tree-zipper';

export * from './db/helpers';
export * from './db/collections';
export default ({ zipTree } = {}) => {
  // configure
  treeZipper.setZipTree(zipTree);
};
