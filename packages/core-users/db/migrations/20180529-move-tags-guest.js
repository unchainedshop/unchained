import { Migrations } from 'meteor/percolate:migrations';
import { Users } from '../collections';

Migrations.add({
  version: 20180529,
  name: 'Move tags and guest from user.profile to user level',
  up() {
    Users.find()
      .fetch()
      .forEach(user => {
        const { profile = {} } = user;
        const displayName =
          profile.displayName ||
          [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        Users.update(
          { _id: user._id },
          {
            $set: {
              tags: user.tags || null,
              guest: !!profile.guest,
              'profile.displayName': displayName
            },
            $unset: {
              'profile.tags': 1,
              'profile.guest': 1,
              'profile.firstName': 1,
              'profile.lastName': 1
            }
          }
        );
      });
  },
  down() {
    Users.find()
      .fetch()
      .forEach(user => {
        const { profile = {} } = user;
        const displayName = profile.displayName || '';
        Users.update(
          { _id: user._id },
          {
            $set: {
              'profile.tags': user.tags || null,
              'profile.guest': user.guest || false,
              'profile.firstName': displayName.split(' ')[0],
              'profile.lastName': displayName
                .split(' ')
                .splice(-1)
                .join(' ')
            },
            $unset: {
              tags: 1,
              guest: 1,
              'profile.displayName': 1
            }
          }
        );
      });
  }
});
