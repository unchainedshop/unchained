import fileStoragePath from './fileStoragePath';

const DEFAULT_OPTIONS = {
  maxSize: 10485760,
  extensionRegex: null,
};
export default (collectionName, options = null) => {
  const fullOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new FilesCollection({
    storagePath: fileStoragePath(collectionName),
    collectionName,
    allowClientCode: false, // Disallow remove files from Client
    onBeforeUpload(file) {
      if (fullOptions.extensionRegex && !fullOptions.extensionRegex.test(file.extension)) {
        return 'filetype not allowed';
      }
      if (file.size > fullOptions.maxSize) {
        return 'file too big';
      }
      return true;
    },
    ...options,
  });
};
