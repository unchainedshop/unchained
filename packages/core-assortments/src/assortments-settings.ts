import { AssortmentsSettingsOptions } from '@unchainedshop/types/assortments';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness';

export const assortmentsSettings = {
  zipTree: null,
  configureSettings: ({
    zipTree = zipTreeByDeepness,
  }: AssortmentsSettingsOptions = {}) => {
    assortmentsSettings.zipTree = zipTree;
  },
};
