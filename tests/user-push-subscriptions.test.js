import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('User Push Subscriptions', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.addPushSubscription for logged in user', () => {
    test('should add push subscription to user', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
        keys: {
          p256dh: 'test-p256dh-key-1',
          auth: 'test-auth-key-1',
        },
      };

      const {
        data: { addPushSubscription },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddPushSubscription($subscription: JSON!) {
            addPushSubscription(subscription: $subscription) {
              _id
              pushSubscriptions {
                endpoint
                userAgent
                _id
              }
            }
          }
        `,
        variables: {
          subscription,
        },
      });
      assert.ok(addPushSubscription);
      assert.strictEqual(addPushSubscription._id, 'user');
      assert.ok(Array.isArray(addPushSubscription.pushSubscriptions));

      const foundSubscription = addPushSubscription.pushSubscriptions.find(
        (sub) => sub._id === 'test-p256dh-key-1',
      );
      assert.ok(foundSubscription);
      assert.strictEqual(foundSubscription.endpoint, subscription.endpoint);
    });

    test('should add multiple push subscriptions', async () => {
      const subscription1 = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-2',
        keys: {
          p256dh: 'test-p256dh-key-2',
          auth: 'test-auth-key-2',
        },
      };

      const subscription2 = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-3',
        keys: {
          p256dh: 'test-p256dh-key-3',
          auth: 'test-auth-key-3',
        },
      };

      await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddPushSubscription($subscription: JSON!) {
            addPushSubscription(subscription: $subscription) {
              _id
              pushSubscriptions {
                endpoint
                userAgent
                _id
              }
            }
          }
        `,
        variables: {
          subscription: subscription1,
        },
      });

      const {
        data: { addPushSubscription },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddPushSubscription($subscription: JSON!) {
            addPushSubscription(subscription: $subscription) {
              _id
              pushSubscriptions {
                endpoint
                userAgent
                _id
              }
            }
          }
        `,
        variables: {
          subscription: subscription2,
        },
      });

      assert.ok(addPushSubscription);
      assert.ok(addPushSubscription.pushSubscriptions.length >= 2);

      const hasSub2 = addPushSubscription.pushSubscriptions.some(
        (sub) => sub._id === 'test-p256dh-key-2',
      );
      const hasSub3 = addPushSubscription.pushSubscriptions.some(
        (sub) => sub._id === 'test-p256dh-key-3',
      );
      assert.ok(hasSub2);
      assert.ok(hasSub3);
    });

    test('should update existing subscription with same p256dh', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-4',
        keys: {
          p256dh: 'test-p256dh-key-4',
          auth: 'test-auth-key-4',
        },
      };

      const {
        data: { addPushSubscription: first },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddPushSubscription($subscription: JSON!) {
            addPushSubscription(subscription: $subscription) {
              _id
              pushSubscriptions {
                endpoint
              }
            }
          }
        `,
        variables: {
          subscription,
        },
      });

      const initialCount = first.pushSubscriptions.length;

      const updatedSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-4-updated',
        keys: {
          p256dh: 'test-p256dh-key-4',
          auth: 'test-auth-key-4-updated',
        },
      };

      const {
        data: { addPushSubscription: second },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddPushSubscription($subscription: JSON!) {
            addPushSubscription(subscription: $subscription) {
              _id
              pushSubscriptions {
                endpoint
                userAgent
                _id
              }
            }
          }
        `,
        variables: {
          subscription: updatedSubscription,
        },
      });
      assert.strictEqual(second.pushSubscriptions.length, initialCount);
    });
    /* 
    test.todo('should unsubscribe from other users when flag is set', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-5',
        keys: {
          p256dh: 'test-p256dh-key-5',
          auth: 'test-auth-key-5',
        },
      };
    }); */
  });

  test.describe('Mutation.addPushSubscription for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-anon',
        keys: {
          p256dh: 'test-p256dh-anon',
          auth: 'test-auth-anon',
        },
      };

      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation AddPushSubscription($subscription: JSON!) {
            addPushSubscription(subscription: $subscription) {
              _id
            }
          }
        `,
        variables: {
          subscription,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.removePushSubscription for logged in user', () => {
    test('should remove push subscription by p256dh', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-remove-1',
        keys: {
          p256dh: 'test-p256dh-remove-1',
          auth: 'test-auth-remove-1',
        },
      };

      const {
        data: { addPushSubscription },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddPushSubscription($subscription: JSON!) {
            addPushSubscription(subscription: $subscription) {
              _id
              pushSubscriptions {
                endpoint
                userAgent
                _id
              }
            }
          }
        `,
        variables: {
          subscription,
        },
      });

      const added = addPushSubscription.pushSubscriptions.some(
        (sub) => sub._id === 'test-p256dh-remove-1',
      );
      assert.equal(added, true);

      const {
        data: { removePushSubscription },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemovePushSubscription($p256dh: String!) {
            removePushSubscription(p256dh: $p256dh) {
              _id
              pushSubscriptions {
                endpoint
                userAgent
                _id
              }
            }
          }
        `,
        variables: {
          p256dh: 'test-p256dh-remove-1',
        },
      });

      assert.ok(removePushSubscription);
      assert.strictEqual(removePushSubscription._id, 'user');
      const removed = removePushSubscription.pushSubscriptions.some(
        (sub) => sub._id === 'test-p256dh-remove-1',
      );
      assert.equal(removed, false);
    });

    test('should handle removing non-existent subscription gracefully', async () => {
      const {
        data: { removePushSubscription },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemovePushSubscription($p256dh: String!) {
            removePushSubscription(p256dh: $p256dh) {
              _id
              pushSubscriptions {
                endpoint
                userAgent
                _id
              }
            }
          }
        `,
        variables: {
          p256dh: 'non-existent-p256dh-key',
        },
      });

      assert.ok(removePushSubscription);
      assert.strictEqual(removePushSubscription._id, 'user');
    });
  });

  test.describe('Mutation.removePushSubscription for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation RemovePushSubscription($p256dh: String!) {
            removePushSubscription(p256dh: $p256dh) {
              _id
            }
          }
        `,
        variables: {
          p256dh: 'some-p256dh-key',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
