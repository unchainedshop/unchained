import { getSetting } from 'meteor/unchained:core-settings';

import FilesCollection from './FilesCollection';

import createDefaultFileCollectionConfig from './createDefaultFileCollectionConfig';

import * as Types from './types';

const createDefaultSettings = () => ({
  maxSize: 10485760,
  extensionRegex: null,
  storage: {
    type: 'filesystem',
  },
});

export default (collectionName, customSettings = null) => {
  const userSettings = getSetting(['files', collectionName], getSetting('files.default'));
  const mergedSettings = {
    ...createDefaultSettings(),
    ...customSettings,
    ...userSettings,
  };

  console.log(`create fs collection ${collectionName}`, mergedSettings);

  const configByType = Types[mergedSettings.storage.type];
  if (!configByType) {
    throw new Error(`unkown storage.type: '${mergedSettings.storage.type}'`);
  }

  const fullconfig = {
    ...createDefaultFileCollectionConfig(collectionName, mergedSettings),
    ...configByType(collectionName, mergedSettings.storage),
  };

  console.log(fullconfig);

  return new FilesCollection(fullconfig);
};
