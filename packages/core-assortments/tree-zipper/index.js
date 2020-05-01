import zipTreeByDeepness from './zipTreeByDeepness';

const config = {
  zipTree: zipTreeByDeepness,
  setZipTree(fn) {
    this.zipTree = fn || zipTreeByDeepness;
  },
};

export default config;
