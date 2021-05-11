import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { SimpleDeliveryProvider } from './seeds/deliveries';
import { SimplePaymentProvider } from './seeds/payments';
import { PlanProduct } from './seeds/products';
import {
  ActiveSubscription,
  InitialSubscription,
  TerminatedSubscription,
} from './seeds/subscriptions';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users';

let connection;
let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Subscriptions', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetchAsAdminUser = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createCart (Subscription)', () => {
    it('checking out a plan product generates a new subscription', async () => {
      const { data: { createCart } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "subscriptionCart") {
              _id
              orderNumber
            }
          }
        `,
      });
      const { data: { checkoutCart } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation prepareAndCheckout(
            $productId: ID!
            $quantity: Int
            $orderId: ID
            $billingAddress: AddressInput
            $contact: ContactInput
            $meta: JSON
          ) {
            addCartProduct(
              productId: $productId
              quantity: $quantity
              orderId: $orderId
            ) {
              _id
              quantity
            }
            updateCart(
              orderId: $orderId
              billingAddress: $billingAddress
              contact: $contact
              meta: $meta
            ) {
              _id
              billingAddress {
                firstName
              }
            }
            checkoutCart(orderId: $orderId) {
              _id
              orderNumber
              status
              subscription {
                _id
                status
              }
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          orderId: createCart._id,
          quantity: 1,
          billingAddress: {
            firstName: 'Hallo',
            lastName: 'Velo',
            addressLine: 'Strasse 1',
            addressLine2: 'Postfach',
            postalCode: '8000',
            city: 'Zürich',
          },
          contact: {
            emailAddress: 'hello@unchained.shop',
            telNumber: '+41999999999',
          },
          meta: {
            hi: 'there',
          },
        },
      });
      expect(checkoutCart).toMatchObject({
        orderNumber: 'subscriptionCart',
        status: 'CONFIRMED',
        subscription: {
          _id: expect.anything(),
          status: 'ACTIVE',
        },
      });
    });
  });
  describe('Mutation.createSubscription', () => {
    it('create a new subscription manually will not activate automatically because of missing order', async () => {
      const { data: { createSubscription } = {} } =
        await graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            mutation createSubscription($plan: SubscriptionPlanInput!) {
              createSubscription(plan: $plan) {
                _id
                status
                subscriptionNumber
                updated
                expires
                meta
                plan {
                  product {
                    _id
                  }
                  quantity
                  configuration {
                    key
                    value
                  }
                }
                payment {
                  provider {
                    _id
                  }
                }
                delivery {
                  provider {
                    _id
                  }
                }
                billingAddress {
                  firstName
                }
                contact {
                  emailAddress
                }
                status
                created
                expires

                isExpired
                subscriptionNumber
                country {
                  isoCode
                }
                currency {
                  isoCode
                }
                meta
                periods {
                  order {
                    _id
                  }
                  start
                  end
                }
              }
            }
          `,
          variables: {
            plan: {
              productId: PlanProduct._id,
            },
          },
        });
      expect(createSubscription).toMatchObject({
        status: 'INITIAL',
        plan: {
          product: {
            _id: PlanProduct._id,
          },
        },
      });
    });

    it('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createSubscription($plan: SubscriptionPlanInput!) {
            createSubscription(plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          plan: {
            productId: 'invalid-id',
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createSubscription($plan: SubscriptionPlanInput!) {
            createSubscription(plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          plan: {
            productId: '',
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
  describe('Mutation.terminateSubscription for admin user should', () => {
    it('change ACTIVE subscription status to TERMINATED', async () => {
      const {
        data: { terminateSubscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateSubscription($subscriptionId: ID!) {
            terminateSubscription(subscriptionId: $subscriptionId) {
              _id
              status
              billingAddress {
                firstName
                lastName
                company
                addressLine
                postalCode
                countryCode
                city
              }
              plan {
                product {
                  _id
                }
                quantity
              }
              billingAddress {
                firstName
              }
              contact {
                emailAddress
                telNumber
              }
              payment {
                provider {
                  _id
                }
              }
              delivery {
                provider {
                  _id
                }
              }
              meta
            }
          }
        `,
        variables: {
          subscriptionId: ActiveSubscription._id,
        },
      });
      expect(terminateSubscription.status).toEqual('TERMINATED');
    });

    it('return SubscriptionWrongStatusError when passed terminated subscription ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateSubscription($subscriptionId: ID!) {
            terminateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: TerminatedSubscription._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual(
        'SubscriptionWrongStatusError',
      );
    });

    it('return SubscriptionNotFoundError when passed non existing subscription ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateSubscription($subscriptionId: ID!) {
            terminateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('SubscriptionNotFoundError');
    });

    it('return InvalidIdError when passed non invalid subscription Id', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateSubscription($subscriptionId: ID!) {
            terminateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.terminateSubscription for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation terminateSubscription($subscriptionId: ID!) {
            terminateSubscription(subscriptionId: $subscriptionId) {
              _id
              status
            }
          }
        `,
        variables: {
          subscriptionId: ActiveSubscription._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.terminateSubscription for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation terminateSubscription($subscriptionId: ID!) {
            terminateSubscription(subscriptionId: $subscriptionId) {
              _id
              status
            }
          }
        `,
        variables: {
          subscriptionId: ActiveSubscription._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.updateSubscription for admin user should', () => {
    it('update subscription details successfuly', async () => {
      const {
        data: { updateSubscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateSubscription(
            $subscriptionId: ID
            $plan: SubscriptionPlanInput
            $billingAddress: AddressInput
            $contact: ContactInput
            $payment: SubscriptionPaymentInput
            $delivery: SubscriptionDeliveryInput
            $meta: JSON
          ) {
            updateSubscription(
              subscriptionId: $subscriptionId
              plan: $plan
              billingAddress: $billingAddress
              contact: $contact
              payment: $payment
              delivery: $delivery
              meta: $meta
            ) {
              _id
              billingAddress {
                firstName
                lastName
                company
                addressLine
                postalCode
                countryCode
                city
              }
              plan {
                product {
                  _id
                }
                quantity
              }
              billingAddress {
                firstName
              }
              contact {
                emailAddress
                telNumber
              }
              payment {
                provider {
                  _id
                }
              }
              delivery {
                provider {
                  _id
                }
              }
              meta
            }
          }
        `,
        variables: {
          subscriptionId: InitialSubscription._id,
          /* plan: {
            productId: SimpleProduct._id,
            quantity: 3,
          }, */
          billingAddress: {
            firstName: 'Mikael Araya',
            lastName: 'Mengistu',
            company: 'Bionic',
            addressLine: 'Bole, Addis Ababa',
            postalCode: '123456',
            city: 'Addis Ababa',
            countryCode: 'ch',
          },
          contact: {
            emailAddress: 'mikael@unchained.shop',
            telNumber: '+251912669988',
          },
          payment: {
            paymentProviderId: SimplePaymentProvider._id,
          },
          delivery: {
            deliveryProviderId: SimpleDeliveryProvider._id,
          },
          /* meta: {
            context: {
              message: 'hello from meta',
            },
          }, */
        },
      });

      expect(updateSubscription).toMatchObject({
        _id: InitialSubscription._id,
        /* plan: {
          product: {
            _id: SimpleProduct._id,
          },
          quantity: 3,
        }, */
        billingAddress: {
          firstName: 'Mikael Araya',
          lastName: 'Mengistu',
          company: 'Bionic',
          addressLine: 'Bole, Addis Ababa',
          postalCode: '123456',
          city: 'Addis Ababa',
          countryCode: 'ch',
        },
        contact: {
          emailAddress: 'mikael@unchained.shop',
          telNumber: '+251912669988',
        },
        payment: {
          provider: { _id: SimplePaymentProvider._id },
        },
        delivery: {
          provider: { _id: SimpleDeliveryProvider._id },
        },
        /* meta: {
          context: {
            message: 'hello from meta',
          },
        }, */
      });
    });
  });

  describe('Mutation.updateSubscription for normal user should', () => {
    it('Update subscription successfuly', async () => {
      const {
        data: { updateSubscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateSubscription(
            $subscriptionId: ID
            $plan: SubscriptionPlanInput
            $billingAddress: AddressInput
            $contact: ContactInput
            $payment: SubscriptionPaymentInput
            $delivery: SubscriptionDeliveryInput
            $meta: JSON
          ) {
            updateSubscription(
              subscriptionId: $subscriptionId
              plan: $plan
              billingAddress: $billingAddress
              contact: $contact
              payment: $payment
              delivery: $delivery
              meta: $meta
            ) {
              _id
              billingAddress {
                firstName
                lastName
                company
                addressLine
                postalCode
                countryCode
                city
              }
            }
          }
        `,
        variables: {
          subscriptionId: InitialSubscription._id,
          billingAddress: {
            firstName: 'Mikael Araya',
            lastName: 'Mengistu',
            company: 'Bionic',
            addressLine: 'Bole, Addis Ababa',
            postalCode: '123456',
            city: 'Addis Ababa',
            countryCode: 'ch',
          },
        },
      });

      expect(updateSubscription).toMatchObject({
        _id: InitialSubscription._id,
        billingAddress: {
          firstName: 'Mikael Araya',
          lastName: 'Mengistu',
          company: 'Bionic',
          addressLine: 'Bole, Addis Ababa',
          postalCode: '123456',
          city: 'Addis Ababa',
          countryCode: 'ch',
        },
      });
    });
  });

  describe('Mutation.updateSubscription for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation updateSubscription(
            $subscriptionId: ID
            $plan: SubscriptionPlanInput
            $billingAddress: AddressInput
            $contact: ContactInput
            $payment: SubscriptionPaymentInput
            $delivery: SubscriptionDeliveryInput
            $meta: JSON
          ) {
            updateSubscription(
              subscriptionId: $subscriptionId
              plan: $plan
              billingAddress: $billingAddress
              contact: $contact
              payment: $payment
              delivery: $delivery
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: ActiveSubscription._id,
          billingAddress: {
            firstName: 'Mikael Araya',
            lastName: 'Mengistu',
            company: 'Bionic',
            addressLine: 'Bole, Addis Ababa',
            postalCode: '123456',
            city: 'Addis Ababa',
            countryCode: 'ch',
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.activateSubscription for admin user', () => {
    it('change status of subscription from INITIAL to ACTIVE', async () => {
      const {
        data: { activateSubscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateSubscription($subscriptionId: ID!) {
            activateSubscription(subscriptionId: $subscriptionId) {
              _id
              status
              created
              expires
              updated

              isExpired
              subscriptionNumber
              meta
              logs {
                _id
                message
              }
              periods {
                start
              }
            }
          }
        `,
        variables: {
          subscriptionId: 'initialsubscription',
        },
      });

      expect(activateSubscription._id).not.toBe(true);
    });

    it('return  SubscriptionWrongStatusError error when trying to activate ACTIVE subscription', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateSubscription($subscriptionId: ID!) {
            activateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'activesubscription',
        },
      });
      expect(errors[0]?.extensions.code).toEqual(
        'SubscriptionWrongStatusError',
      );
    });

    it('return  SubscriptionNotFoundError when passed non existing subscription ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateSubscription($subscriptionId: ID!) {
            activateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions.code).toEqual('SubscriptionNotFoundError');
    });

    it('return  InvalidIdError when passed invalid subscription ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateSubscription($subscriptionId: ID!) {
            activateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: '',
        },
      });
      expect(errors[0]?.extensions.code).toEqual('InvalidIdError');
    });

    it('return  ServerError when passed invalid subscription ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateSubscription($subscriptionId: ID!) {
            activateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'initialsubscription-wrong-plan',
        },
      });

      expect(
        errors[0]?.message.includes(
          'No suitable subscription plugin available for this plan configuration',
        ),
      ).toBe(true);
    });
  });

  describe('Mutation.activateSubscription for normal user', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation activateSubscription($subscriptionId: ID!) {
            activateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'initialsubscription',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.activateSubscription for anonymous user', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation activateSubscription($subscriptionId: ID!) {
            activateSubscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'initialsubscription',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.subscriptions for admin user should', () => {
    it('return list of subscriptions', async () => {
      const {
        data: { subscriptions },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscriptions($limit: Int, $offset: Int) {
            subscriptions(limit: $limit, offset: $offset) {
              _id
              status
              created
              expires
              updated

              isExpired
              subscriptionNumber
              meta
              logs(limit: 10, offset: 0) {
                _id
              }
              periods {
                start
                end
                isTrial
                order {
                  _id
                }
              }
              plan {
                product {
                  _id
                }
                quantity
              }
              payment {
                provider {
                  _id
                }
                meta
              }
              user {
                _id
              }
              billingAddress {
                firstName
              }
              contact {
                telNumber
                emailAddress
              }
              country {
                _id
              }
              currency {
                _id
                isoCode
              }
              meta
            }
          }
        `,
        variables: {},
      });
      expect(subscriptions.length > 0).toBe(true);
    });

    it('return number of subscriptions specified by limit starting from a given offset', async () => {
      const {
        data: { subscriptions },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscriptions($limit: Int, $offset: Int) {
            subscriptions(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {
          limit: 1,
          offset: 2,
        },
      });
      expect(subscriptions.length).toBe(1);
    });
  });

  describe('query.subscriptionsCount for admin user should', () => {
    it('return total number of subscriptions', async () => {
      const {
        data: { subscriptionsCount },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            subscriptionsCount
          }
        `,
        variables: {},
      });
      expect(subscriptionsCount > 0).toBe(true);
    });
  });

  describe('query.subscriptionsCount for Normal user should', () => {
    it('return total number of subscriptions', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            subscriptionsCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.subscriptionsCount for anonymous user should', () => {
    it('return total number of subscriptions', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            subscriptionsCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.subscriptions for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query subscriptions($limit: Int, $offset: Int) {
            subscriptions(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.subscriptions for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query subscriptions($limit: Int, $offset: Int) {
            subscriptions(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
  describe('query.subscription for admin user should', () => {
    it('return subscription specified by Id', async () => {
      const {
        data: { subscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscription($subscriptionId: ID!) {
            subscription(subscriptionId: $subscriptionId) {
              _id
              status
              created
              expires
              updated

              isExpired
              subscriptionNumber
              meta
              logs(limit: 10, offset: 0) {
                _id
              }
              periods {
                start
                end
                isTrial
                order {
                  _id
                }
              }
              plan {
                product {
                  _id
                }
                quantity
              }
              payment {
                provider {
                  _id
                }
                meta
              }
              user {
                _id
              }
              billingAddress {
                firstName
              }
              contact {
                telNumber
                emailAddress
              }
              country {
                _id
              }
              currency {
                _id
                isoCode
              }
              meta
            }
          }
        `,
        variables: {
          subscriptionId: 'activesubscription',
        },
      });

      expect(subscription._id).toBe('activesubscription');
    });

    it('return expired true by (default) when asked for subsciprion with expiry date of past', async () => {
      const {
        data: { subscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscription($subscriptionId: ID!) {
            subscription(subscriptionId: $subscriptionId) {
              _id
              isExpired
            }
          }
        `,
        variables: {
          subscriptionId: 'expiredsubscription',
        },
      });
      expect(subscription.isExpired).toBe(true);
    });

    it('return expired false by (default) when asked for subsciprion with expiry date in future', async () => {
      const {
        data: { subscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscription($subscriptionId: ID!) {
            subscription(subscriptionId: $subscriptionId) {
              _id
              isExpired
            }
          }
        `,
        variables: {
          subscriptionId: 'activesubscription',
        },
      });
      expect(subscription.isExpired).toBe(false);
    });

    it('return expired true when asked for subscription with expiry date in future when referenceDate is even later', async () => {
      const {
        data: { subscription },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscription($subscriptionId: ID!, $referenceDate: Date) {
            subscription(subscriptionId: $subscriptionId) {
              _id
              isExpired(referenceDate: $referenceDate)
            }
          }
        `,
        variables: {
          subscriptionId: 'activesubscription',
          referenceDate: new Date('2030/09/12'),
        },
      });
      expect(subscription.isExpired).toBe(true);
    });

    it('return InvalidIdError when passed invalid subscription ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscription($subscriptionId: ID!) {
            subscription(subscriptionId: $subscriptionId) {
              _id
              isExpired
            }
          }
        `,
        variables: {
          subscriptionId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('query.subscription for normal user', () => {
    it('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query subscription($subscriptionId: ID!) {
            subscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'activesubscription',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.subscription for anonymous user', () => {
    it('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query subscription($subscriptionId: ID!) {
            subscription(subscriptionId: $subscriptionId) {
              _id
            }
          }
        `,
        variables: {
          subscriptionId: 'activesubscription',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
});
