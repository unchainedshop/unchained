const { FILE_STORAGE_PATH } = process.env;

const defaultFileStoragePath = (subdir) => {
  if (FILE_STORAGE_PATH) {
    return `${FILE_STORAGE_PATH}/${subdir}`;
  }
  return `assets/app/uploads/${subdir}`;
};

export default (collectionName, storageOptions) => ({
  storagePath: storageOptions.storagePath || defaultFileStoragePath(collectionName),
});
