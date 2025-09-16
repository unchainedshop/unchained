import localizations from '../../src/i18n';

import {
  CreatePaymentProviderResponse,
  PaymentProviderOperations,
  PaymentProvidersInterfaceResponse,
  PaymentProvidersListResponse,
  PaymentProvidersTypeResponse,
  RemovePaymentProviderResponse,
  SinglePaymentProviderResponse,
  UpdatePaymentProviderResponse,
} from '../mock/payment-provider';

import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Payment Provider', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      const { body } = req;
      if (hasOperationName(req, PaymentProviderOperations.GetProvidersList)) {
        const { variables } = body;
        if (variables?.type === 'GENERIC') {
          aliasQuery(req, PaymentProviderOperations.GetGenericProviders);
        } else {
          aliasQuery(req, PaymentProviderOperations.GetProvidersList);
        }
        req.reply(PaymentProvidersListResponse);
      }
      if (hasOperationName(req, PaymentProviderOperations.GetSingleProvider)) {
        aliasQuery(req, PaymentProviderOperations.GetSingleProvider);
        req.reply(SinglePaymentProviderResponse);
      }
      if (hasOperationName(req, PaymentProviderOperations.GetProvidersType)) {
        aliasQuery(req, PaymentProviderOperations.GetProvidersType);
        req.reply(PaymentProvidersTypeResponse);
      }
      if (hasOperationName(req, PaymentProviderOperations.GetInterfaces)) {
        aliasQuery(req, PaymentProviderOperations.GetInterfaces);
        req.reply(PaymentProvidersInterfaceResponse);
      }
      if (hasOperationName(req, PaymentProviderOperations.CreateProvider)) {
        aliasMutation(req, PaymentProviderOperations.CreateProvider);
        req.reply(CreatePaymentProviderResponse);
      }
      if (hasOperationName(req, PaymentProviderOperations.UpdateProvider)) {
        aliasMutation(req, PaymentProviderOperations.UpdateProvider);
        req.reply(UpdatePaymentProviderResponse);
      }
      if (hasOperationName(req, PaymentProviderOperations.RemoveProvider)) {
        aliasMutation(req, PaymentProviderOperations.RemoveProvider);
        req.reply(RemovePaymentProviderResponse);
      }
    });

    cy.visit('/');
    cy.get('button').contains(localizations.en.system).click({ force: true });
    cy.get('a[href="/payment-provider"]')
      .contains(localizations.en.payment_providers)
      .click({ force: true });

    cy.wait(fullAliasName(PaymentProviderOperations.GetProvidersList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          type: null,
        });
        expect(response.body).to.deep.eq(PaymentProvidersListResponse);
      },
    );

    cy.wait(fullAliasName(PaymentProviderOperations.GetProvidersType)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq(PaymentProvidersTypeResponse);
      },
    );
    cy.location('pathname').should('eq', '/payment-provider');

    cy.get('h2').should(
      'contain.text',
      localizations.en.payment_providers,
    );
  });

  it('Should Navigate to [PAYMENT PROVIDERS] page successfully', () => {
    cy.get('tr').should('have.length', 2);
  });

  it('Should [FILTER] list based on selected value', () => {
    const { options } = PaymentProvidersTypeResponse.data.paymentProviderType;
    const [, , genericOption] = options;

    cy.get('tr').should('have.length', 2);
    cy.get('select#select-type').contains(localizations.en.filter_by_type);
    cy.get('select#select-type').select(genericOption.value);

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/payment-provider');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        type: genericOption.value,
      });
    });

    cy.wait(fullAliasName(PaymentProviderOperations.GetGenericProviders)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          type: genericOption.value,
        });
        expect(response.body).to.deep.eq(PaymentProvidersListResponse);
      },
    );

    cy.location('pathname').should('eq', '/payment-provider');
  });

  it('Should Navigate to [NEW DELIVERY PROVIDER] form page successfully', () => {
    cy.get('a[href="/payment-provider/new"]')
      .should('contain.text', localizations.en.add)
      .click();
    cy.location('pathname').should('eq', '/payment-provider/new');

    cy.wait(fullAliasName(PaymentProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: 'INVOICE',
        });
        expect(response.body).to.deep.eq(PaymentProvidersInterfaceResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.new_payment_provider_header,
    );
  });

  it('Should [ADD NEW DELIVERY PROVIDER] successfully', () => {
    const [firstPickUpInterface] =
      PaymentProvidersInterfaceResponse.data.paymentInterfaces;
    const { options } = PaymentProvidersTypeResponse.data.paymentProviderType;
    const [, , genericType] = options;

    cy.get('a[href="/payment-provider/new"]')
      .should('have.text', localizations.en.add)
      .click();
    cy.location('pathname').should('eq', '/payment-provider/new');

    cy.wait(fullAliasName(PaymentProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: 'INVOICE',
        });
        expect(response.body).to.deep.eq(PaymentProvidersInterfaceResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.new_payment_provider_header,
    );
    cy.get('select#type').select(genericType.value);

    cy.wait(fullAliasName(PaymentProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: genericType.value,
        });
        expect(response.body).to.deep.eq(PaymentProvidersInterfaceResponse);
      },
    );

    cy.get('select#adapterKey').select(firstPickUpInterface.value);
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.create_provider}"]`,
    )
      .should('have.value', localizations.en.create_provider)
      .click();

    cy.wait(
      fullAliasMutationName(PaymentProviderOperations.CreateProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        paymentProvider: {
          adapterKey: firstPickUpInterface._id,
          type: genericType.value,
        },
      });
      expect(response.body).to.deep.eq(CreatePaymentProviderResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/payment-provider?paymentProviderId=${CreatePaymentProviderResponse.data.createPaymentProvider._id}`,
    );
  });

  it('Should [ERROR] when required fields are not provided in new payment provider', () => {
    cy.get('a[href="/payment-provider/new"]')
      .should('contain.text', localizations.en.add)
      .click();
    cy.location('pathname').should('eq', '/payment-provider/new');

    cy.wait(fullAliasName(PaymentProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: 'INVOICE',
        });
        expect(response.body).to.deep.eq(PaymentProvidersInterfaceResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.new_payment_provider_header,
    );
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.create_provider}"]`,
    )
      .should('have.value', localizations.en.create_provider)
      .click();

    cy.get('label[for="type"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.type,
      ),
    );

    cy.get('label[for="adapterKey"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.adapter,
      ),
    );

    cy.get(
      `input[type="submit"][aria-label="${localizations.en.create_provider}"]`,
    )
      .should('have.value', localizations.en.create_provider)
      .should('be.disabled');

    cy.location('pathname').should('eq', '/payment-provider/new');
  });

  it('Should [INITIALIZE PAYMENT PROVIDER] successfully', () => {
    const { paymentProvider } = SinglePaymentProviderResponse.data;

    cy.get(`a[href="/payment-provider?paymentProviderId=${paymentProvider._id}"]`).click();
    cy.location('pathname').should(
      'eq',
      `/payment-provider?paymentProviderId=${paymentProvider._id}`,
    );

    cy.wait(fullAliasName(PaymentProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          paymentProviderId: paymentProvider._id,
        });
        expect(response.body).to.deep.eq(SinglePaymentProviderResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.update_payment_provider_header,
    );

    cy.get('textarea#configuration').should(
      'have.value',
      JSON.stringify(paymentProvider.configuration || {}, null, 2),
    );
  });

  it('Should [UPDATE DELIVERY PROVIDER] successfully', () => {
    const { paymentProvider } = SinglePaymentProviderResponse.data;

    cy.get(`a[href="/payment-provider?paymentProviderId=${paymentProvider._id}"]`).click();
    cy.location('pathname').should(
      'eq',
      `/payment-provider?paymentProviderId=${paymentProvider._id}`,
    );
    cy.wait(fullAliasName(PaymentProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          paymentProviderId: paymentProvider._id,
        });
        expect(response.body).to.deep.eq(SinglePaymentProviderResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.update_payment_provider_header,
    );

    cy.get('textarea#configuration')
      .clear()
      .type(JSON.stringify(paymentProvider.configuration, null, 2))
      .blur();

    cy.get(
      `input[type="submit"][aria-label="${localizations.en.update_configuration}"]`,
    )
      .should('have.value', localizations.en.update_configuration)
      .click();

    cy.wait(
      fullAliasMutationName(PaymentProviderOperations.UpdateProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        paymentProvider: {
          configuration: paymentProvider.configuration,
        },
        paymentProviderId: paymentProvider._id,
      });
      expect(response.body).to.deep.eq(UpdatePaymentProviderResponse);
    });

    cy.location('pathname').should('eq', '/payment-provider');
  });

  it('Should [ERROR] when pattern of configuration fields are not correct in update provider', () => {
    const { paymentProvider } = SinglePaymentProviderResponse.data;

    cy.get(`a[href="/payment-provider?paymentProviderId=${paymentProvider._id}"]`).click();
    cy.location('pathname').should(
      'eq',
      `/payment-provider?paymentProviderId=${paymentProvider._id}`,
    );
    cy.wait(fullAliasName(PaymentProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          paymentProviderId: paymentProvider._id,
        });
        expect(response.body).to.deep.eq(SinglePaymentProviderResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.update_payment_provider_header,
    );

    cy.get('textarea#configuration').type('l').blur();

    cy.get(
      `input[type="submit"][aria-label="${localizations.en.update_configuration}"]`,
    )
      .should('have.value', localizations.en.update_configuration)
      .should('be.disabled');
  });

  it('Should [DELETE PAYMENT PROVIDER] successfully', () => {
    const { paymentProvider } = SinglePaymentProviderResponse.data;

    cy.get(`a[href="/payment-provider?paymentProviderId=${paymentProvider._id}"]`).click();
    cy.location('pathname').should(
      'eq',
      `/payment-provider?paymentProviderId=${paymentProvider._id}`,
    );

    cy.wait(fullAliasName(PaymentProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          paymentProviderId: paymentProvider._id,
        });
        expect(response.body).to.deep.eq(SinglePaymentProviderResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.update_payment_provider_header,
    );

    cy.get('button[type="button"]').contains(localizations.en.delete).click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_payment_provider)
      .click();

    cy.wait(
      fullAliasMutationName(PaymentProviderOperations.RemoveProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        paymentProviderId: paymentProvider._id,
      });
      expect(response.body).to.deep.eq(RemovePaymentProviderResponse);
    });

    cy.location('pathname').should('eq', '/payment-provider');
  });

  it('Should [DELETE PAYMENT PROVIDER FROM LIST] successfully', () => {
    const { paymentProvider } = SinglePaymentProviderResponse.data;

    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_payment_provider)
      .click();

    cy.wait(
      fullAliasMutationName(PaymentProviderOperations.RemoveProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        paymentProviderId: paymentProvider._id,
      });
      expect(response.body).to.deep.eq(RemovePaymentProviderResponse);
    });

    cy.location('pathname').should('eq', '/payment-provider');
  });
});
