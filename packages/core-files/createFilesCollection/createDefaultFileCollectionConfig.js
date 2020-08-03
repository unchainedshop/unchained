const { FILE_STORAGE_PATH } = process.env;

export default (collectionName, options) => ({
  collectionName,
  allowClientCode: false, // Disallow remove files from Client
  debug: Meteor.isServer && Meteor.isDevelopment,
  storagePath() {
    if (FILE_STORAGE_PATH) {
      return `${FILE_STORAGE_PATH}/${this.collectionName}`;
    }
    return `assets/app/uploads/${this.collectionName}`;
  },
  onBeforeUpload(file) {
    if (
      options.extensionRegex &&
      !options.extensionRegex.test(file.extension)
    ) {
      return 'filetype not allowed';
    }
    if (file.size > options.maxSize) {
      return 'file too big';
    }
    return true;
  },
});
