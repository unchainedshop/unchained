import zipTreeByDeepness from './tree-zipper/zipTreeByDeepness';

export const assortmentSettings = {
  zipTree: null,
  load({ zipTree = zipTreeByDeepness } = {}) {
    this.zipTree = zipTree;
  },
};
