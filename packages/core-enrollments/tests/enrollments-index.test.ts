import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { dbIdToString } from 'meteor/unchained:utils';
import { configureUsersModule } from 'meteor/unchained:core-users';
import { configureEnrollmentsModule } from 'meteor/unchained:core-enrollments';
import { EnrollmentsModule } from '@unchainedshop/types/enrollments';
import { Context } from '@unchainedshop/types/api';
import { UsersModule } from '@unchainedshop/types/user';

describe('Test exports', () => {
  let modules: { enrollments: EnrollmentsModule; users: UsersModule } = {
    enrollments: null,
    users: null,
  };

  before(async () => {
    const db = initDb();
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

    modules = {
      enrollments: enrollmentsModule,
      users: usersModules,
    };
  });

  it('Insert enrollment', async () => {
    let enrollment = await modules.enrollments.create(
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
      { userId: 'Test-User-123' } as Context
    );

    assert.ok(enrollment);
    const enrollmentId = dbIdToString(enrollment._id);
    enrollment = await modules.enrollments.findEnrollment({ enrollmentId });

    assert.ok(enrollment);

    const deletedCount = await modules.enrollments
      .delete(enrollmentId, 'Test-User-1')
      .catch((error) => {
        console.log(error);
        return 0;
      });
    assert.equal(deletedCount, 1);
  });
});
