import zipTreeByDeepness from './tree-zipper/zipTreeByDeepness';

const settings = {
  zipTree: null,
  load({ zipTree = zipTreeByDeepness } = {}) {
    this.zipTree = zipTree;
  },
};

export default settings;
