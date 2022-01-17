import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness';
import { AssortmentsSettingsOptions } from '@unchainedshop/types/assortments'

export const assortmentsSettings = {
  zipTree: null,
  configureSettings: ({ zipTree = zipTreeByDeepness }: AssortmentsSettingsOptions = {}) => {
    assortmentsSettings.zipTree = zipTree;
  },
};
