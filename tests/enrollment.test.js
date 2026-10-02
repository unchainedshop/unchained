import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { SimpleDeliveryProvider } from './seeds/deliveries.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { PlanProduct } from './seeds/products.js';
import {
  ActiveEnrollment,
  InitialEnrollment,
  InitialEnrollmentForSuspendTest,
  TerminatedEnrollment,
  ScheduledTerminationEnrollment,
  SuspendedEnrollment,
  PausedEnrollment,
  ActiveEnrollmentWithoutExpiry,
  CommitmentEnrollment,
  UserCommitmentEnrollment,
} from './seeds/enrollments.js';
import {
  SimpleProduct,
  DraftPlanProduct,
  CommitmentPlanProduct,
  ProxyPlanProduct1,
  MeteredPlanProduct,
} from './seeds/products.js';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

test.describe('Enrollments', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.createCart (Enrollment)', () => {
    test('checking out a plan product generates a new enrollment', async () => {
      const { data: { createCart } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "enrollmentCart") {
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
            addCartProduct(productId: $productId, quantity: $quantity, orderId: $orderId) {
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
              enrollment {
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
            emailAddress: 'hello@unchained.local',
            telNumber: '+41999999999',
          },
          meta: {
            hi: 'there',
          },
        },
      });
      assert.partialDeepStrictEqual(checkoutCart, {
        orderNumber: 'enrollmentCart',
        status: 'CONFIRMED',
        enrollment: {
          status: 'ACTIVE',
        },
      });
    });

    test('checking out a plan product with a cart item configuration does not propagate it to the enrollment plan', async () => {
      const configuration = [
        { key: 'seats', value: '5' },
        { key: 'note', value: 'hello' },
      ];
      const { data: { createCart } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "enrollmentCartWithConfiguration") {
              _id
              orderNumber
            }
          }
        `,
      });
      const { data: { addCartProduct, checkoutCart } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation prepareAndCheckout(
            $productId: ID!
            $quantity: Int
            $orderId: ID
            $configuration: [ProductConfigurationParameterInput!]
            $billingAddress: AddressInput
            $contact: ContactInput
          ) {
            addCartProduct(
              productId: $productId
              quantity: $quantity
              orderId: $orderId
              configuration: $configuration
            ) {
              _id
              configuration {
                key
                value
              }
            }
            updateCart(orderId: $orderId, billingAddress: $billingAddress, contact: $contact) {
              _id
            }
            checkoutCart(orderId: $orderId) {
              _id
              status
              enrollment {
                _id
                status
                plan {
                  quantity
                  configuration {
                    key
                    value
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          orderId: createCart._id,
          quantity: 1,
          configuration,
          billingAddress: {
            firstName: 'Hallo',
            lastName: 'Velo',
            addressLine: 'Strasse 1',
            addressLine2: 'Postfach',
            postalCode: '8000',
            city: 'Zürich',
          },
          contact: {
            emailAddress: 'hello@unchained.local',
            telNumber: '+41999999999',
          },
        },
      });
      // Precondition: the cart item carries the configuration into checkout
      assert.deepStrictEqual(addCartProduct.configuration, configuration);
      assert.partialDeepStrictEqual(checkoutCart, {
        status: 'CONFIRMED',
        enrollment: {
          status: 'ACTIVE',
          plan: {
            quantity: 1,
            configuration: [],
          },
        },
      });
    });
  });

  test.describe('Mutation.createEnrollment', () => {
    test('a manual enrollment without an order or trial remains initial', async () => {
      const { data: { createEnrollment } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createEnrollment($plan: EnrollmentPlanInput!) {
            createEnrollment(plan: $plan) {
              _id
              status
              enrollmentNumber
              updated
              expires
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
              enrollmentNumber
              country {
                isoCode
              }
              currency {
                isoCode
              }
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
      assert.partialDeepStrictEqual(createEnrollment, {
        status: 'INITIAL',
        plan: {
          product: {
            _id: PlanProduct._id,
          },
          quantity: 1,
        },
        isExpired: false,
      });
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createEnrollment($plan: EnrollmentPlanInput!) {
            createEnrollment(plan: $plan) {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createEnrollment($plan: EnrollmentPlanInput!) {
            createEnrollment(plan: $plan) {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation enrollment with a plan that has no supported adapter', () => {
    test('createEnrollment fails with EnrollmentPlanNotSupportedError and persists nothing', async () => {
      const {
        data: { enrollmentsCount: before },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            enrollmentsCount
          }
        `,
      });

      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createEnrollment($plan: EnrollmentPlanInput!) {
            createEnrollment(plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          plan: {
            productId: MeteredPlanProduct._id,
          },
        },
      });

      // F1: a clean, typed error instead of a generic INTERNAL_SERVER_ERROR
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentPlanNotSupportedError');
      assert.strictEqual(data?.createEnrollment ?? null, null);

      // F2: no orphaned enrollment left behind
      const {
        data: { enrollmentsCount: after },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            enrollmentsCount
          }
        `,
      });
      assert.strictEqual(after, before);
    });

    test('updateEnrollment plan change is rejected without mutating the enrollment', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
          plan: { productId: MeteredPlanProduct._id },
        },
      });

      // F1: clean error for the plan-change path
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentPlanChangeNotSupportedError');
      assert.strictEqual(data?.updateEnrollment ?? null, null);

      // the plan must not be half-applied: enrollment keeps its original product and status
      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              status
              plan {
                product {
                  _id
                }
              }
            }
          }
        `,
        variables: { enrollmentId: ActiveEnrollment._id },
      });
      assert.strictEqual(enrollment.plan.product._id, PlanProduct._id);
      assert.strictEqual(enrollment.status, 'ACTIVE');
    });
  });

  test.describe('Mutation.terminateEnrollment for admin user should', () => {
    test('schedule termination of an ACTIVE enrollment at the end of the notice period', async () => {
      const {
        data: { terminateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
              expires
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollmentWithoutExpiry._id,
        },
      });
      // The licensed notice period is one billing interval (a week) after the current period
      assert.strictEqual(terminateEnrollment.status, 'ACTIVE');
      assert.strictEqual(
        new Date(terminateEnrollment.expires).getTime(),
        new Date('2030/09/17').getTime(),
      );
    });

    test('keep an earlier end date when terminating again', async () => {
      const {
        data: { terminateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
              expires
            }
          }
        `,
        variables: {
          enrollmentId: ScheduledTerminationEnrollment._id,
        },
      });
      assert.strictEqual(
        new Date(terminateEnrollment.expires).getTime(),
        ScheduledTerminationEnrollment.expires.getTime(),
      );
    });

    test('return EnrollmentWrongStatusError when passed terminated enrollment ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: TerminatedEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });

    test('return EnrollmentNotFoundError when passed non existing enrollment ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentNotFoundError');
    });

    test('return InvalidIdError when passed non invalid enrollment Id', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.terminateEnrollment for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.terminateEnrollment for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.updateEnrollment for admin user should', () => {
    test('update enrollment details successfuly', async () => {
      const {
        data: { updateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment(
            $enrollmentId: ID
            $plan: EnrollmentPlanInput
            $billingAddress: AddressInput
            $contact: ContactInput
            $payment: EnrollmentPaymentInput
            $delivery: EnrollmentDeliveryInput
            $meta: JSON
          ) {
            updateEnrollment(
              enrollmentId: $enrollmentId
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
            }
          }
        `,
        variables: {
          enrollmentId: InitialEnrollment._id,
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
            emailAddress: 'mikael@unchained.local',
            telNumber: '+251912669988',
          },
          payment: {
            paymentProviderId: SimplePaymentProvider._id,
          },
          delivery: {
            deliveryProviderId: SimpleDeliveryProvider._id,
          },
        },
      });

      assert.partialDeepStrictEqual(updateEnrollment, {
        _id: InitialEnrollment._id,
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
          emailAddress: 'mikael@unchained.local',
          telNumber: '+251912669988',
        },
        payment: {
          provider: { _id: SimplePaymentProvider._id },
        },
        delivery: {
          provider: { _id: SimpleDeliveryProvider._id },
        },
      });
    });
  });

  test.describe('Mutation.updateEnrollment for normal user should', () => {
    test('Update enrollment successfuly', async () => {
      const {
        data: { updateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment(
            $enrollmentId: ID
            $plan: EnrollmentPlanInput
            $billingAddress: AddressInput
            $contact: ContactInput
            $payment: EnrollmentPaymentInput
            $delivery: EnrollmentDeliveryInput
            $meta: JSON
          ) {
            updateEnrollment(
              enrollmentId: $enrollmentId
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
          enrollmentId: InitialEnrollment._id,
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

      assert.deepStrictEqual(updateEnrollment, {
        _id: InitialEnrollment._id,
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

  test.describe('Mutation.updateEnrollment for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation updateEnrollment(
            $enrollmentId: ID
            $plan: EnrollmentPlanInput
            $billingAddress: AddressInput
            $contact: ContactInput
            $payment: EnrollmentPaymentInput
            $delivery: EnrollmentDeliveryInput
            $meta: JSON
          ) {
            updateEnrollment(
              enrollmentId: $enrollmentId
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
          enrollmentId: ActiveEnrollment._id,
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

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.activateEnrollment for admin user', () => {
    test('change status of enrollment from INITIAL to ACTIVE', async () => {
      const {
        data: { activateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
              created
              expires
              updated

              isExpired
              enrollmentNumber
              periods {
                start
              }
            }
          }
        `,
        variables: {
          enrollmentId: 'initialenrollment',
        },
      });
      assert.partialDeepStrictEqual(activateEnrollment, {
        _id: InitialEnrollment._id,
        status: 'ACTIVE',
      });
    });

    test('return EnrollmentWrongStatusError when activating an already ACTIVE enrollment', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: 'activeenrollment',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });

    test('return EnrollmentNotFoundError when passed non existing enrollment ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions.code, 'EnrollmentNotFoundError');
    });

    test('return InvalidIdError when passed invalid enrollment ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions.code, 'InvalidIdError');
    });

    test('return unexpected error when passed invalid enrollment ID with non-suitable plugins', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'initialenrollment-wrong-plan',
        },
      });
      assert.strictEqual(errors[0]?.message.includes('Unexpected error.'), true);
    });
  });

  test.describe('Mutation.activateEnrollment for normal user', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'initialenrollment',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.activateEnrollment for anonymous user', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'initialenrollment',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.enrollments for admin user should', () => {
    test('return list of enrollments', async () => {
      const {
        data: { enrollments },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollments($limit: Int, $offset: Int) {
            enrollments(limit: $limit, offset: $offset) {
              _id
              status
              created
              expires
              updated
              isExpired
              enrollmentNumber
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
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(enrollments.length > 0, true);
    });

    test('return list of searched enrollments by enrollment number', async () => {
      const {
        data: { enrollments },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollments($queryString: String) {
            enrollments(queryString: $queryString) {
              _id
              enrollmentNumber
            }
          }
        `,
        variables: {
          queryString: 'initial',
        },
      });
      assert.ok(
        enrollments.some(
          ({ enrollmentNumber }) => enrollmentNumber === ActiveEnrollment.enrollmentNumber,
        ),
      );
    });

    test('return number of enrollments specified by limit starting from a given offset', async () => {
      const {
        data: { enrollments },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollments($limit: Int, $offset: Int) {
            enrollments(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {
          limit: 1,
          offset: 2,
        },
      });
      assert.strictEqual(enrollments.length, 1);
    });
  });

  test.describe('query.enrollmentsCount for admin user should', () => {
    test('return total number of enrollments', async () => {
      const {
        data: { enrollmentsCount },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            enrollmentsCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(enrollmentsCount > 0, true);
    });
  });

  test.describe('query.enrollmentsCount for Normal user should', () => {
    test('return total number of enrollments', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            enrollmentsCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.enrollmentsCount for anonymous user should', () => {
    test('return total number of enrollments', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            enrollmentsCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.enrollments for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query enrollments($limit: Int, $offset: Int) {
            enrollments(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.enrollments for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query enrollments($limit: Int, $offset: Int) {
            enrollments(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.enrollment for admin user should', () => {
    test('return enrollment specified by Id', async () => {
      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              status
              created
              expires
              updated
              isExpired
              enrollmentNumber
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
            }
          }
        `,
        variables: {
          enrollmentId: 'activeenrollment',
        },
      });

      assert.strictEqual(enrollment._id, 'activeenrollment');
    });

    test('return expired true by (default) when asked for subsciprion with expiry date of past', async () => {
      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              isExpired
            }
          }
        `,
        variables: {
          enrollmentId: 'expiredenrollment',
        },
      });
      assert.strictEqual(enrollment.isExpired, true);
    });

    test('return expired false by (default) when asked for subsciprion with expiry date in future', async () => {
      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              isExpired
            }
          }
        `,
        variables: {
          enrollmentId: 'activeenrollment',
        },
      });
      assert.strictEqual(enrollment.isExpired, false);
    });

    test('return expired true when asked for enrollment with expiry date in future when referenceDate is even later', async () => {
      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!, $referenceDate: Timestamp) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              isExpired(referenceDate: $referenceDate)
            }
          }
        `,
        variables: {
          enrollmentId: 'activeenrollment',
          referenceDate: new Date('2030/09/12'),
        },
      });
      assert.strictEqual(enrollment.isExpired, true);
    });

    test('return InvalidIdError when passed invalid enrollment ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              isExpired
            }
          }
        `,
        variables: {
          enrollmentId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('query.enrollment for normal user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'activeenrollment',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.enrollment for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'activeenrollment',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.suspendEnrollment for admin user', () => {
    test('suspend an active enrollment', async () => {
      const {
        data: { suspendEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      assert.strictEqual(suspendEnrollment.status, 'SUSPENDED');
    });

    test('resume a suspended enrollment via activateEnrollment', async () => {
      const {
        data: { activateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
              enrollmentNumber
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      assert.strictEqual(activateEnrollment.status, 'ACTIVE');
      assert.strictEqual(activateEnrollment.enrollmentNumber, ActiveEnrollment.enrollmentNumber);
    });

    test('return EnrollmentWrongStatusError when suspending a terminated enrollment', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: TerminatedEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });
  });

  test.describe('Mutation.suspendEnrollment for anonymous user', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.updateEnrollment expires for admin user', () => {
    const updateExpires = (enrollmentId, expires) =>
      graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $expires: DateTimeISO) {
            updateEnrollment(enrollmentId: $enrollmentId, expires: $expires) {
              _id
              status
              expires
            }
          }
        `,
        variables: { enrollmentId, expires },
      });

    test('set the end date as given', async () => {
      const expires = new Date('2035/01/01');
      const { data } = await updateExpires(InitialEnrollment._id, expires.toISOString());
      assert.strictEqual(new Date(data.updateEnrollment.expires).getTime(), expires.getTime());
    });

    test('clear the end date', async () => {
      const { data } = await updateExpires(InitialEnrollment._id, null);
      assert.strictEqual(data.updateEnrollment.expires, null);
    });

    test('terminate right away when the end date has passed', async () => {
      const {
        data: { createEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createEnrollment($plan: EnrollmentPlanInput!) {
            createEnrollment(plan: $plan) {
              _id
            }
          }
        `,
        variables: { plan: { productId: PlanProduct._id } },
      });

      const { data } = await updateExpires(createEnrollment._id, new Date('2020/01/01').toISOString());
      assert.strictEqual(data.updateEnrollment.status, 'TERMINATED');
    });
  });

  test.describe('Plan change on active enrollment (Feature 5)', () => {
    test('can change plan on active enrollment when adapter supports it', async () => {
      const {
        data: { updateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
              status
              plan {
                product {
                  _id
                }
                quantity
              }
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
          plan: {
            productId: PlanProduct._id,
            quantity: 5,
          },
        },
      });
      assert.strictEqual(updateEnrollment.status, 'ACTIVE');
      assert.strictEqual(updateEnrollment.plan.product._id, PlanProduct._id);
      assert.strictEqual(updateEnrollment.plan.quantity, 5);
    });

    test('plan change on INITIAL enrollment still works', async () => {
      const {
        data: { updateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
              status
              plan {
                product {
                  _id
                }
                quantity
              }
            }
          }
        `,
        variables: {
          enrollmentId: InitialEnrollment._id,
          plan: {
            productId: PlanProduct._id,
            quantity: 3,
          },
        },
      });
      assert.strictEqual(updateEnrollment.plan.product._id, PlanProduct._id);
      assert.strictEqual(updateEnrollment.plan.quantity, 3);
    });

    test('plan change to a non-PLAN_PRODUCT returns ProductWrongTypeError', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
          plan: {
            productId: SimpleProduct._id,
            quantity: 1,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductWrongTypeError');
    });

    test('plan change to a non-existing product returns ProductNotFoundError', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
          plan: {
            productId: 'nonexistent-product-id',
            quantity: 1,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('failed adapter resolution leaves the existing plan unchanged', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
          plan: {
            productId: ProxyPlanProduct1._id,
            quantity: 1,
          },
        },
      });
      assert.ok(errors?.length);

      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              plan {
                product {
                  _id
                }
              }
            }
          }
        `,
        variables: { enrollmentId: ActiveEnrollment._id },
      });
      assert.strictEqual(enrollment.plan.product._id, PlanProduct._id);
    });

    test('plan change on TERMINATED enrollment returns EnrollmentWrongStatusError', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: TerminatedEnrollment._id,
          plan: {
            productId: PlanProduct._id,
            quantity: 1,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });
  });

  test.describe('Mutation.suspendEnrollment negative paths', () => {
    test('return EnrollmentWrongStatusError when suspending an INITIAL enrollment', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: InitialEnrollmentForSuspendTest._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });

    test('return EnrollmentWrongStatusError when suspending an already SUSPENDED enrollment', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: SuspendedEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });

    test('suspend a PAUSED enrollment transitions to SUSPENDED', async () => {
      const {
        data: { suspendEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: PausedEnrollment._id,
        },
      });
      assert.strictEqual(suspendEnrollment.status, 'SUSPENDED');
    });
  });

  test.describe('Mutation.terminateEnrollment on SUSPENDED enrollment', () => {
    test('terminate a SUSPENDED enrollment schedules termination', async () => {
      const {
        data: { terminateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
              expires
            }
          }
        `,
        variables: {
          enrollmentId: SuspendedEnrollment._id,
        },
      });
      assert.strictEqual(terminateEnrollment.status, 'SUSPENDED');
      assert.strictEqual(
        new Date(terminateEnrollment.expires).getTime(),
        SuspendedEnrollment.expires.getTime(),
      );
    });
  });

  test.describe('Mutation.activateEnrollment on TERMINATED enrollment', () => {
    test('return EnrollmentWrongStatusError when activating a TERMINATED enrollment', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: TerminatedEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });
  });

  test.describe('Plan change to draft product', () => {
    test('plan change to a draft PLAN_PRODUCT returns ProductWrongStatusError', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
          plan: {
            productId: DraftPlanProduct._id,
            quantity: 1,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductWrongStatusError');
    });
  });

  test.describe('Plan change on SUSPENDED enrollment', () => {
    test('plan change on SUSPENDED enrollment returns EnrollmentWrongStatusError', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateEnrollment($enrollmentId: ID, $plan: EnrollmentPlanInput) {
            updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: SuspendedEnrollment._id,
          plan: {
            productId: PlanProduct._id,
            quantity: 1,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'EnrollmentWrongStatusError');
    });
  });

  test.describe('Resume keeps the end date', () => {
    test('activating a SUSPENDED enrollment keeps its scheduled termination', async () => {
      // First suspend the ScheduledTerminationEnrollment
      await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
            }
          }
        `,
        variables: {
          enrollmentId: ScheduledTerminationEnrollment._id,
        },
      });

      // Now resume it via activateEnrollment
      const {
        data: { activateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
              expires
            }
          }
        `,
        variables: {
          enrollmentId: ScheduledTerminationEnrollment._id,
        },
      });
      assert.strictEqual(activateEnrollment.status, 'ACTIVE');
      assert.strictEqual(
        new Date(activateEnrollment.expires).getTime(),
        ScheduledTerminationEnrollment.expires.getTime(),
      );
    });
  });

  test.describe('Mutation.suspendEnrollment for normal user', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!) {
            suspendEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Termination with cancellation reason and comment', () => {
    test('terminateEnrollment stores reason and comment', async () => {
      const {
        data: { terminateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment(
            $enrollmentId: ID!
            $reason: EnrollmentTerminationReason
            $comment: String
          ) {
            terminateEnrollment(enrollmentId: $enrollmentId, reason: $reason, comment: $comment) {
              _id
              status
              cancellationReason
              cancellationComment
              expires
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollmentWithoutExpiry._id,
          reason: 'USER_REQUESTED',
          comment: 'Too expensive for my needs',
        },
      });
      assert.ok(terminateEnrollment);
      assert.strictEqual(terminateEnrollment.cancellationReason, 'USER_REQUESTED');
      assert.strictEqual(terminateEnrollment.cancellationComment, 'Too expensive for my needs');
    });
  });

  test.describe('Suspend with scheduled resumeAt', () => {
    test('suspendEnrollment with resumeAt stores the date', async () => {
      const resumeDate = new Date('2030/06/01').toISOString();
      const {
        data: { suspendEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation suspendEnrollment($enrollmentId: ID!, $resumeAt: DateTimeISO) {
            suspendEnrollment(enrollmentId: $enrollmentId, resumeAt: $resumeAt) {
              _id
              status
              resumeAt
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
          resumeAt: resumeDate,
        },
      });
      assert.strictEqual(suspendEnrollment.status, 'SUSPENDED');
      assert.ok(suspendEnrollment.resumeAt);
    });

    test('activateEnrollment clears resumeAt on resume', async () => {
      const {
        data: { activateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
              resumeAt
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      assert.strictEqual(activateEnrollment.status, 'ACTIVE');
      assert.strictEqual(activateEnrollment.resumeAt, null);
    });
  });

  test.describe('Query enrollment cancellation fields', () => {
    test('cancellationReason and cancellationComment visible on query', async () => {
      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              cancellationReason
              cancellationComment
              resumeAt
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollmentWithoutExpiry._id,
        },
      });
      assert.strictEqual(enrollment.cancellationReason, 'USER_REQUESTED');
      assert.strictEqual(enrollment.cancellationComment, 'Too expensive for my needs');
    });
  });

  test.describe('Contract terms and minimum commitments', () => {
    test('query commitment enrollment shows contractStartDate and minimumCommitmentEnd', async () => {
      const {
        data: { enrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query enrollment($enrollmentId: ID!) {
            enrollment(enrollmentId: $enrollmentId) {
              _id
              contractStartDate
              minimumCommitmentEnd
            }
          }
        `,
        variables: {
          enrollmentId: CommitmentEnrollment._id,
        },
      });
      assert.ok(enrollment.contractStartDate);
      assert.ok(enrollment.minimumCommitmentEnd);
    });

    test('an owner can neither set nor clear the end date', async () => {
      for (const expires of [new Date('2040/01/01').toISOString(), null]) {
        const { errors } = await graphqlFetchAsNormalUser({
          query: /* GraphQL */ `
            mutation updateEnrollment($enrollmentId: ID, $expires: DateTimeISO) {
              updateEnrollment(enrollmentId: $enrollmentId, expires: $expires) {
                _id
              }
            }
          `,
          variables: { enrollmentId: UserCommitmentEnrollment._id, expires },
        });
        assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
      }
    });

    test('an owner terminating before the minimum commitment ends keeps it until then', async () => {
      const {
        data: { terminateEnrollment },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
              status
              expires
            }
          }
        `,
        variables: {
          enrollmentId: UserCommitmentEnrollment._id,
        },
      });

      assert.strictEqual(terminateEnrollment.status, 'ACTIVE');
      assert.strictEqual(
        new Date(terminateEnrollment.expires).getTime(),
        UserCommitmentEnrollment.minimumCommitmentEnd.getTime(),
      );
    });

    test('terminating commitment enrollment schedules termination at commitment end', async () => {
      const {
        data: { terminateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
              _id
              expires
            }
          }
        `,
        variables: {
          enrollmentId: CommitmentEnrollment._id,
        },
      });
      assert.strictEqual(
        new Date(terminateEnrollment.expires).getTime(),
        CommitmentEnrollment.minimumCommitmentEnd.getTime(),
      );
    });

    test('updateProductPlan with minimumCommitmentPeriods persists the value', async () => {
      const {
        data: { updateProductPlan },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
              ... on PlanProduct {
                plan {
                  minimumCommitmentPeriods
                  billingInterval
                  billingIntervalCount
                  usageCalculationType
                }
              }
            }
          }
        `,
        variables: {
          productId: CommitmentPlanProduct._id,
          plan: {
            usageCalculationType: 'LICENSED',
            billingInterval: 'MONTHS',
            billingIntervalCount: 1,
            minimumCommitmentPeriods: 6,
          },
        },
      });
      assert.strictEqual(updateProductPlan.plan.minimumCommitmentPeriods, 6);
    });
  });
});
