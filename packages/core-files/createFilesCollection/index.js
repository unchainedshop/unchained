import { getSetting } from 'meteor/unchained:core-settings';

import merge from 'lodash.merge';

import FilesCollection from './FilesCollection';

const createDefaultSettings = () => ({
  maxSize: 10485760,
  extensionRegex: null,
});

export default (collectionName, customSettings = null) => {
  const mergedSettings = merge(
    {},
    createDefaultSettings(),
    customSettings,
    getSetting('files.default'),
    getSetting(['files', collectionName])
  );

  return new FilesCollection({
    collectionName,
    maxSize: mergedSettings.maxSize,
    extensionRegex: mergedSettings.extensionRegex,
  });
};
