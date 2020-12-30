import { getSetting } from 'meteor/unchained:core-settings';

import merge from 'lodash.merge';

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
  const mergedSettings = merge(
    {},
    createDefaultSettings(),
    customSettings,
    getSetting('files.default'),
    getSetting(['files', collectionName])
  );

  const configByType = Types[mergedSettings.storage.type];
  if (!configByType) {
    throw new Error(`unkown storage.type: '${mergedSettings.storage.type}'`);
  }

  const fullconfig = {
    ...createDefaultFileCollectionConfig(collectionName, mergedSettings),
    ...configByType(collectionName, mergedSettings.storage),
  };
  // console.log(
  //   'createDefaultFileCollectionConfig',
  //   createDefaultFileCollectionConfig(collectionName, mergedSettings)
  // );
  // console.log(
  //   'configByType',
  //   configByType(collectionName, mergedSettings.storage)
  // );

  // console.log('fullconfig: ', fullconfig);

  return new FilesCollection(collectionName);
};
