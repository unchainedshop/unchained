import { fakeTimestampFields, fakeAddress } from 'meteor/unchained:utils';
import { createFakeAvatar } from 'meteor/unchained:core-avatars';
import { Factory } from 'meteor/dburles:factory';
import { Accounts } from 'meteor/accounts-base';
import faker from 'faker';
import { Users } from './collections';

Factory.define('user', Users, {
  username: () => faker.internet.userName(),
  password: () => faker.internet.password(),
  emails: () => [{ address: faker.internet.email(), verified: faker.random.boolean() }],
  profile: () => ({
    firstName: faker.name.firstName(),
    lastName: faker.name.firstName(),
    birthday: faker.date.past(65, '2003-08-02'),
    phoneMobile: faker.phone.phoneNumber(),
    gender: faker.random.arrayElement([null, 'f', 'm']),
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
