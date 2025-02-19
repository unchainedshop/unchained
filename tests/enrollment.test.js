import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { SimpleDeliveryProvider } from './seeds/deliveries.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { PlanProduct } from './seeds/products.js';
import { ActiveEnrollment, InitialEnrollment, TerminatedEnrollment } from './seeds/enrollments.js';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Enrollments', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  describe('Mutation.createCart (Enrollment)', () => {
    it('checking out a plan product generates a new enrollment', async () => {
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
      expect(checkoutCart).toMatchObject({
        orderNumber: 'enrollmentCart',
        status: 'CONFIRMED',
        enrollment: {
          _id: expect.anything(),
          status: 'ACTIVE',
        },
      });
    });
  });

  describe('Mutation.createEnrollment', () => {
    it('create a new enrollment manually will not activate automatically because of missing order', async () => {
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
      expect(createEnrollment).toMatchObject({
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

    it('return not found error when passed non existing productId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.terminateEnrollment for admin user should', () => {
    it('change ACTIVE enrollment status to TERMINATED', async () => {
      const {
        data: { terminateEnrollment },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation terminateEnrollment($enrollmentId: ID!) {
            terminateEnrollment(enrollmentId: $enrollmentId) {
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
            }
          }
        `,
        variables: {
          enrollmentId: ActiveEnrollment._id,
        },
      });
      expect(terminateEnrollment.status).toEqual('TERMINATED');
    });

    it('return EnrollmentWrongStatusError when passed terminated enrollment ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('EnrollmentWrongStatusError');
    });

    it('return EnrollmentNotFoundError when passed non existing enrollment ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('EnrollmentNotFoundError');
    });

    it('return InvalidIdError when passed non invalid enrollment Id', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.terminateEnrollment for normal user should', () => {
    it('return NoPermissionError', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.terminateEnrollment for anonymous user should', () => {
    it('return NoPermissionError', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.updateEnrollment for admin user should', () => {
    it('update enrollment details successfuly', async () => {
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

      expect(updateEnrollment).toMatchObject({
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

  describe('Mutation.updateEnrollment for normal user should', () => {
    it('Update enrollment successfuly', async () => {
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

      expect(updateEnrollment).toMatchObject({
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

  describe('Mutation.updateEnrollment for anonymous user should', () => {
    it('return NoPermissionError', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.activateEnrollment for admin user', () => {
    it('change status of enrollment from INITIAL to ACTIVE', async () => {
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
      expect(activateEnrollment).toMatchObject({
        _id: InitialEnrollment._id,
        status: 'ACTIVE',
      });
    });

    it('return EnrollmentWrongStatusError error when trying to activate ACTIVE enrollment', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation activateEnrollment($enrollmentId: ID!) {
            activateEnrollment(enrollmentId: $enrollmentId) {
              _id
            }
          }
        `,
        variables: {
          enrollmentId: 'activeenrollment',
        },
      });
      expect(errors[0]?.extensions.code).toEqual('EnrollmentWrongStatusError');
    });

    it('return EnrollmentNotFoundError when passed non existing enrollment ID', async () => {
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
      expect(errors[0]?.extensions.code).toEqual('EnrollmentNotFoundError');
    });

    it('return InvalidIdError when passed invalid enrollment ID', async () => {
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
      expect(errors[0]?.extensions.code).toEqual('InvalidIdError');
    });

    it('return unexpected error when passed invalid enrollment ID with non-suitable plugins', async () => {
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
      expect(errors[0]?.message.includes('Unexpected error.')).toBe(true);
    });
  });

  describe('Mutation.activateEnrollment for normal user', () => {
    it('return NoPermissionError', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.activateEnrollment for anonymous user', () => {
    it('return NoPermissionError', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.enrollments for admin user should', () => {
    it('return list of enrollments', async () => {
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
      expect(enrollments.length > 0).toBe(true);
    });

    it('return list of searched enrollments by enrollment number', async () => {
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
      expect(enrollments.length).toEqual(2);
    });

    it('return number of enrollments specified by limit starting from a given offset', async () => {
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
      expect(enrollments.length).toBe(1);
    });
  });

  describe('query.enrollmentsCount for admin user should', () => {
    it('return total number of enrollments', async () => {
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
      expect(enrollmentsCount > 0).toBe(true);
    });
  });

  describe('query.enrollmentsCount for Normal user should', () => {
    it('return total number of enrollments', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            enrollmentsCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.enrollmentsCount for anonymous user should', () => {
    it('return total number of enrollments', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            enrollmentsCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.enrollments for normal user should', () => {
    it('return NoPermissionError', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.enrollments for anonymous user should', () => {
    it('return NoPermissionError', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.enrollment for admin user should', () => {
    it('return enrollment specified by Id', async () => {
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

      expect(enrollment._id).toBe('activeenrollment');
    });

    it('return expired true by (default) when asked for subsciprion with expiry date of past', async () => {
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
      expect(enrollment.isExpired).toBe(true);
    });

    it('return expired false by (default) when asked for subsciprion with expiry date in future', async () => {
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
      expect(enrollment.isExpired).toBe(false);
    });

    it('return expired true when asked for enrollment with expiry date in future when referenceDate is even later', async () => {
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
      expect(enrollment.isExpired).toBe(true);
    });

    it('return InvalidIdError when passed invalid enrollment ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('query.enrollment for normal user', () => {
    it('should return NoPermissionError', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.enrollment for anonymous user', () => {
    it('should return NoPermissionError', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
});
