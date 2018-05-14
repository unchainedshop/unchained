import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';

FilesCollection.prototype.insertWithRemoteBuffer = function insert({
  file: {
    name: fileName, type, size, buffer,
  }, meta = {}, ...rest
}) {
  const syncWrite = Meteor.wrapAsync(this.write, this);
  return syncWrite(buffer, {
    fileName,
    type,
    size,
    meta,
    ...rest,
  });
};
