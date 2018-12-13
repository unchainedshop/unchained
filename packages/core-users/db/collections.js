import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { fileStoragePath } from 'meteor/unchained:utils';

export const Avatars = new FilesCollection({
  storagePath: fileStoragePath('avatars'),
  collectionName: 'avatars',
  allowClientCode: false, // Disallow remove files from Client
  onBeforeUpload(file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 10485760 && /png|jpg|jpeg/i.test(file.extension)) {
      return true;
    }
    return 'Please upload image, with size equal or less than 10MB';
  },
});

export const Users = Meteor.users;
