import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness';

export const assortmentsSettings = {
  zipTree: null,
  load({ zipTree = zipTreeByDeepness } = {}) {
    this.zipTree = zipTree;
  },
};
