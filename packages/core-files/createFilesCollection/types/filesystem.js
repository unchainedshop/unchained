export default (collectionName, storageOptions) =>
  storageOptions.storagePath
    ? {
        storagePath: storageOptions.storagePath,
      }
    : {};
