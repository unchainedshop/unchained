import { fakeTimestampFields, fakeAddress } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { Accounts } from 'meteor/accounts-base';
import faker from 'faker';
import { Avatars, Users } from './collections';

const createFakeAvatar = () => Meteor // eslint-disable-line
  .wrapAsync(Avatars.load, Avatars)(faker.internet.avatar(), {
    fileName: faker.system.fileName(),
  });

Factory.define('user', Users, {
  username: () => faker.internet.userName(),
  emails: () => [
    { address: faker.internet.email(), verified: faker.random.boolean() },
  ],
  profile: () => ({
    displayName: `${faker.name.firstName()} ${faker.name.lastName()}`,
    birthday: faker.date.past(65, '2003-08-02'),
    phoneMobile: faker.phone.phoneNumber(),
    gender: faker.random.arrayElement([null, 'f', 'm', 'c']),
    address: fakeAddress,
  }),
  guest: faker.random.boolean(),
  tags: [faker.random.arrayElement(['studio', 'peka', 'supplier'])],
  lastBillingAddress: fakeAddress,
  lastDeliveryAddress: fakeAddress,
  avatarId: () => createFakeAvatar()._id,
  ...fakeTimestampFields,
}).after((user) => {
  Accounts.setPassword(user._id, 'password');
});
