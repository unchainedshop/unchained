import { Context } from '@unchainedshop/types/api';
import { QuotationsModule } from '@unchainedshop/types/quotations';
import { UsersModule } from '@unchainedshop/types/user';
import { assert } from 'chai';
import { configureQuotationsModule } from '@unchainedshop/core-quotations';
import { configureUsersModule } from '@unchainedshop/core-users';
import { initDb } from 'meteor/unchained:mongodb';
import '../plugins/manual';

describe('Test exports', () => {
  const context: {
    modules: { quotations: QuotationsModule; users: UsersModule };
    services: { countries: { resolveDefaultCurrencyCode: () => string } };
    userId: string;
  } = {
    modules: {
      quotations: null,
      users: null,
    },
    services: {
      countries: {
        resolveDefaultCurrencyCode: () => 'CHF',
      },
    },
    userId: 'Test-User-1234',
  };

  before(async () => {
    const db = await initDb();
    const quotationsModule = await configureQuotationsModule({ db }).catch(
      (error) => {
        console.error(error);
        throw error;
      }
    );

    const usersModules = await configureUsersModule({ db }).catch((error) => {
      console.error(error);
      throw error;
    });

    context.modules.quotations = quotationsModule;
    context.modules.users = usersModules;
  });

  it('Insert quotation', async () => {
    let quotation = await context.modules.quotations.create(
      {
        countryCode: 'CH',
        productId: 'Product-123',
        userId: 'Test-User-1',
      },
      context as Context
    );

    assert.ok(quotation);
    const quotationId = quotation._id;
    quotation = await context.modules.quotations.findQuotation({
      quotationId,
    });

    assert.ok(quotation);

    await context.modules.quotations.updateProposal(
      quotationId,
      {
        price: 1000,
        meta: { something: 'Test' },
      },
      context.userId
    );
  });
});
