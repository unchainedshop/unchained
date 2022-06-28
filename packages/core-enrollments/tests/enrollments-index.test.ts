import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureUsersModule } from '@unchainedshop/core-users';
import { configureEnrollmentsModule } from '@unchainedshop/core-enrollments';
import { EnrollmentsModule } from '@unchainedshop/types/enrollments';
import { Context } from '@unchainedshop/types/api';
import { User, UsersModule } from '@unchainedshop/types/user';

describe('Test exports', () => {
  const context: {
    modules: { enrollments: EnrollmentsModule; users: UsersModule };
    services: { countries: { resolveDefaultCurrencyCode: () => string } };
  } = {
    modules: {
      enrollments: null,
      users: null,
    },
    services: {
      countries: {
        resolveDefaultCurrencyCode: () => 'CHF',
      },
    },
  };
  let user: User

  before(async () => {
    const db = await initDb();
    const enrollmentsModule = await configureEnrollmentsModule({ db }).catch(
      (error) => {
        console.error(error);

        throw error;
      }
    );

    const usersModules = await configureUsersModule({ db }).catch((error) => {
      console.error(error);

      throw error;
    });

    context.modules.enrollments = enrollmentsModule;
    context.modules.users = usersModules;
  });

  it('Insert enrollment', async () => {
    let enrollment = await context.modules.enrollments.create(
      {
        billingAddress: {
          lastName: 'Mustermann',
          firstName: 'Max',
          addressLine: 'Teststreet 11',
          city: 'Zürich',
          postalCode: '8009',
          company: 'Unchained Commerce',
          countryCode: 'CH',
        },
        countryCode: 'CH',
        currencyCode: 'CHF',
        contact: {},
        productId: 'Product-123',
        quantity: 2,
        userId: 'Test-User-1',
        payment: {
          paymentProviderId: 'payment-provider-1',
          context: {},
        },
        delivery: {
          deliveryProviderId: 'delivery-provider-1',
          context: {},
        },
      },
      context as Context
    );

    assert.ok(enrollment);
    const enrollmentId = enrollment._id;
    enrollment = await context.modules.enrollments.findEnrollment({
      enrollmentId,
    });

    assert.ok(enrollment);

    const deletedCount = await context.modules.enrollments
      .delete(enrollmentId, 'Test-User-1')
      .catch((error) => {
        return 0;
      });
    assert.equal(deletedCount, 1);
  });
});
