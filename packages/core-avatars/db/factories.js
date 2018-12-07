import { Meteor } from 'meteor/meteor';
import faker from 'faker';
import { Avatars } from './collections';

export default () => Meteor.wrapAsync(Avatars.load, Avatars)(faker.internet.avatar(), {
  fileName: faker.system.fileName(),
});
