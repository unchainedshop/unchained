import localizations from '../../src/i18n';

import {
  CreateDeliveryProviderResponse,
  DeliveryProviderListResponse,
  DeliveryProviderOperations,
  DeliveryProviderPickUpInterfaces,
  DeliveryProvidersTypeResponse,
  RemoveDeliveryProviderResponse,
  SingleDeliveryProviderResponse,
  UpdateDeliveryProviderResponse,
} from '../mock/delivery-provider';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Delivery Provider', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      const { body } = req;
      if (hasOperationName(req, DeliveryProviderOperations.GetProvidersList)) {
        const { variables } = body;
        if (variables?.type === 'PICKUP') {
          aliasQuery(
            req,
            DeliveryProviderOperations.GetPickUpDeliveryProviders,
          );
        } else {
          aliasQuery(req, DeliveryProviderOperations.GetProvidersList);
        }
        req.reply(DeliveryProviderListResponse);
      }
      if (hasOperationName(req, DeliveryProviderOperations.GetSingleProvider)) {
        aliasQuery(req, DeliveryProviderOperations.GetSingleProvider);
        req.reply(SingleDeliveryProviderResponse);
      }
      if (hasOperationName(req, DeliveryProviderOperations.GetProvidersType)) {
        aliasQuery(req, DeliveryProviderOperations.GetProvidersType);
        req.reply(DeliveryProvidersTypeResponse);
      }
      if (hasOperationName(req, DeliveryProviderOperations.GetInterfaces)) {
        aliasQuery(req, DeliveryProviderOperations.GetInterfaces);
        req.reply(DeliveryProviderPickUpInterfaces);
      }
      if (hasOperationName(req, DeliveryProviderOperations.CreateProvider)) {
        aliasMutation(req, DeliveryProviderOperations.CreateProvider);
        req.reply(CreateDeliveryProviderResponse);
      }
      if (hasOperationName(req, DeliveryProviderOperations.UpdateProvider)) {
        aliasMutation(req, DeliveryProviderOperations.UpdateProvider);
        req.reply(UpdateDeliveryProviderResponse);
      }
      if (hasOperationName(req, DeliveryProviderOperations.RemoveProvider)) {
        aliasMutation(req, DeliveryProviderOperations.RemoveProvider);
        req.reply(RemoveDeliveryProviderResponse);
      }
    });

    cy.visit('/');
    cy.get('button').contains(localizations.en.system).click({ force: true });
    cy.get('a[href="/delivery-provider"]')
      .contains(localizations.en.delivery_providers)
      .click({ force: true });

    cy.wait(fullAliasName(DeliveryProviderOperations.GetProvidersList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          type: null,
        });
        expect(response.body).to.deep.eq(DeliveryProviderListResponse);
      },
    );

    cy.wait(fullAliasName(DeliveryProviderOperations.GetProvidersType)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq(DeliveryProvidersTypeResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.delivery_providers,
    );
    cy.location('pathname').should('eq', '/delivery-provider');
  });

  it('Show Navigate to [DELIVERY PROVIDERS] page successfully', () => {
    cy.get('tr').should('have.length', 4);
  });

  it('Should [FILTER] list based on selected value', () => {
    const { options } = DeliveryProvidersTypeResponse.data.deliveryProviderType;
    const [firstOption] = options;

    cy.get('tr').should('have.length', 4);
    cy.get('select#select-type').contains(localizations.en.filter_by_type);
    cy.get('select#select-type').select(firstOption.value);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/delivery-provider');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        type: firstOption.value,
      });
    });

    cy.wait(
      fullAliasName(DeliveryProviderOperations.GetPickUpDeliveryProviders),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        type: firstOption.value,
      });
      expect(response.body).to.deep.eq(DeliveryProviderListResponse);
    });

    cy.location('pathname').should('eq', '/delivery-provider');
  });

  it('Show Navigate to [NEW DELIVERY PROVIDER] form page successfully', () => {
    cy.get('a[href="/delivery-provider/new"]')
      .should('contain.text', localizations.en.add)
      .click();

    cy.wait(fullAliasName(DeliveryProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: 'SHIPPING',
        });
        expect(response.body).to.deep.eq(DeliveryProviderPickUpInterfaces);
      },
    );

    cy.location('pathname').should('eq', '/delivery-provider/new');
    cy.get('h2').should('contain.text', localizations.en.new_delivery_provider);
  });

  it('Show [ADD NEW DELIVERY PROVIDER]  successfully', () => {
    const [firstPickUpInterface] =
      DeliveryProviderPickUpInterfaces.data.deliveryInterfaces;
    const { options } = DeliveryProvidersTypeResponse.data.deliveryProviderType;
    const [firstType] = options;

    cy.get('a[href="/delivery-provider/new"]').click();
    cy.location('pathname').should('eq', '/delivery-provider/new');

    cy.wait(fullAliasName(DeliveryProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: 'SHIPPING',
        });
        expect(response.body).to.deep.eq(DeliveryProviderPickUpInterfaces);
      },
    );

    cy.get('h2').should('contain.text', localizations.en.new_delivery_provider);
    cy.get('select#type').select(firstType.value);

    if (firstType.value !== 'SHIPPING') {
      cy.wait(fullAliasName(DeliveryProviderOperations.GetInterfaces)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            providerType: firstType.value,
          });
          expect(response.body).to.deep.eq(DeliveryProviderPickUpInterfaces);
        },
      );
    }

    cy.get('select#adapterKey').select(firstPickUpInterface.value);
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.create_provider}"]`,
    )
      .should('have.value', localizations.en.create_provider)
      .click();

    cy.wait(
      fullAliasMutationName(DeliveryProviderOperations.CreateProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        deliveryProvider: {
          adapterKey: firstPickUpInterface._id,
          type: firstType.value,
        },
      });
      expect(response.body).to.deep.eq(CreateDeliveryProviderResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/delivery-provider?deliveryProviderId=${CreateDeliveryProviderResponse.data.createDeliveryProvider._id}`,
    );
  });

  it('Show [ERROR] when required fields are not provided in new delivery provider', () => {
    cy.location('pathname').should('eq', '/delivery-provider');
    cy.get('a[href="/delivery-provider/new"]')
      .contains(localizations.en.add)
      .click();
    cy.location('pathname').should('eq', '/delivery-provider/new');

    cy.wait(fullAliasName(DeliveryProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: 'SHIPPING',
        });
        expect(response.body).to.deep.eq(DeliveryProviderPickUpInterfaces);
      },
    );

    cy.get('h2').should('contain.text', localizations.en.new_delivery_provider);
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

    cy.get('input[type="submit"]')
      .should('contain.value', localizations.en.create_provider)
      .should('be.disabled');

    cy.location('pathname').should('eq', '/delivery-provider/new');
  });

  it('Show [INITIALIZE DELIVERY PROVIDER] successfully', () => {
    const { deliveryProvider } = SingleDeliveryProviderResponse.data;

    cy.location('pathname').should('eq', '/delivery-provider');
    cy.get(`a[href="/delivery-provider?deliveryProviderId=${deliveryProvider._id}"]`).click();

    cy.wait(fullAliasName(DeliveryProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          deliveryProviderId: deliveryProvider._id,
        });
        expect(response.body).to.deep.eq(SingleDeliveryProviderResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/delivery-provider?deliveryProviderId=${deliveryProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_delivery_configuration,
    );

    cy.get('textarea#configuration').should(
      'have.value',
      JSON.stringify(deliveryProvider.configuration || {}, null, 2),
    );
  });

  it('Show [UPDATE DELIVERY PROVIDER] successfully', () => {
    const { deliveryProvider } = SingleDeliveryProviderResponse.data;

    cy.location('pathname').should('eq', '/delivery-provider');
    cy.get(`a[href="/delivery-provider?deliveryProviderId=${deliveryProvider._id}"]`).click();

    cy.wait(fullAliasName(DeliveryProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          deliveryProviderId: deliveryProvider._id,
        });
        expect(response.body).to.deep.eq(SingleDeliveryProviderResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/delivery-provider?deliveryProviderId=${deliveryProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_delivery_configuration,
    );

    cy.get('textarea#configuration')
      .clear()
      .type(JSON.stringify(deliveryProvider.configuration, null, 2))
      .blur();

    cy.get(
      `input[type="submit"][aria-label="${localizations.en.update_configuration}"]`,
    )
      .should('have.value', localizations.en.update_configuration)
      .click();

    cy.wait(
      fullAliasMutationName(DeliveryProviderOperations.UpdateProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        deliveryProvider: {
          configuration: deliveryProvider.configuration,
        },
        deliveryProviderId: deliveryProvider._id,
      });
      expect(response.body).to.deep.eq(UpdateDeliveryProviderResponse);
    });

    cy.location('pathname').should('eq', '/delivery-provider');
  });

  it('Show [ERROR] when pattern of configuration fields are not correct in update delivery provider', () => {
    const { deliveryProvider } = SingleDeliveryProviderResponse.data;

    cy.location('pathname').should('eq', '/delivery-provider');
    cy.get(`a[href="/delivery-provider?deliveryProviderId=${deliveryProvider._id}"]`).click();

    cy.wait(fullAliasName(DeliveryProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          deliveryProviderId: deliveryProvider._id,
        });
        expect(response.body).to.deep.eq(SingleDeliveryProviderResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/delivery-provider?deliveryProviderId=${deliveryProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_delivery_configuration,
    );

    cy.get('textarea#configuration').type('l').blur();

    cy.get(
      `input[type="submit"][aria-label="${localizations.en.update_configuration}"]`,
    )
      .should('have.value', localizations.en.update_configuration)
      .should('be.disabled');
  });

  it('Show [DELETE DELIVERY PROVIDER] successfully', () => {
    const { deliveryProvider } = SingleDeliveryProviderResponse.data;

    cy.get(`a[href="/delivery-provider?deliveryProviderId=${deliveryProvider._id}"]`).click();
    cy.wait(fullAliasName(DeliveryProviderOperations.GetSingleProvider)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          deliveryProviderId: deliveryProvider._id,
        });
        expect(response.body).to.deep.eq(SingleDeliveryProviderResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/delivery-provider?deliveryProviderId=${deliveryProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_delivery_configuration,
    );
    cy.get('button[type="button"]').contains(localizations.en.delete).click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_delivery_provider)
      .click();

    cy.wait(
      fullAliasMutationName(DeliveryProviderOperations.RemoveProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        deliveryProviderId: deliveryProvider._id,
      });
      expect(response.body).to.deep.eq(RemoveDeliveryProviderResponse);
    });

    cy.location('pathname').should('eq', '/delivery-provider');
  });

  it('Show [DELETE DELIVERY PROVIDER FROM LIST] successfully', () => {
    const { deliveryProvider } = SingleDeliveryProviderResponse.data;

    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_delivery_provider)
      .click();

    cy.wait(
      fullAliasMutationName(DeliveryProviderOperations.RemoveProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        deliveryProviderId: deliveryProvider._id,
      });
      expect(response.body).to.deep.eq(RemoveDeliveryProviderResponse);
    });

    cy.location('pathname').should('eq', '/delivery-provider');
  });
});
