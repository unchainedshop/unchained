import localizations from '../../src/i18n';

import {
  CreateWarehousingProviderResponse,
  RemoveWarehousingProviderResponse,
  SingleWarehousingProviderResponse,
  UpdateWarehousingProviderResponse,
  WarehousingProviderInterfacesResponse,
  WarehousingProviderOperations,
  WarehousingProvidersListResponse,
  WarehousingProvidersTypeResponse,
} from '../mock/warehousing-provider';

import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Warehousing Provider', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      const { body } = req;
      if (
        hasOperationName(req, WarehousingProviderOperations.GetProvidersList)
      ) {
        const { variables } = body;
        if (variables?.type === 'PHYSICAL') {
          aliasQuery(
            req,
            WarehousingProviderOperations.GetPickUpWarehousingProviders,
          );
        } else {
          aliasQuery(req, WarehousingProviderOperations.GetProvidersList);
        }
        req.reply(WarehousingProvidersListResponse);
      }
      if (
        hasOperationName(req, WarehousingProviderOperations.GetSingleProvider)
      ) {
        aliasQuery(req, WarehousingProviderOperations.GetSingleProvider);
        req.reply(SingleWarehousingProviderResponse);
      }
      if (
        hasOperationName(req, WarehousingProviderOperations.GetProvidersType)
      ) {
        aliasQuery(req, WarehousingProviderOperations.GetProvidersType);
        req.reply(WarehousingProvidersTypeResponse);
      }
      if (hasOperationName(req, WarehousingProviderOperations.GetInterfaces)) {
        aliasQuery(req, WarehousingProviderOperations.GetInterfaces);
        req.reply(WarehousingProviderInterfacesResponse);
      }
      if (hasOperationName(req, WarehousingProviderOperations.CreateProvider)) {
        aliasMutation(req, WarehousingProviderOperations.CreateProvider);
        req.reply(CreateWarehousingProviderResponse);
      }
      if (hasOperationName(req, WarehousingProviderOperations.UpdateProvider)) {
        aliasMutation(req, WarehousingProviderOperations.UpdateProvider);
        req.reply(UpdateWarehousingProviderResponse);
      }
      if (hasOperationName(req, WarehousingProviderOperations.RemoveProvider)) {
        aliasMutation(req, WarehousingProviderOperations.RemoveProvider);
        req.reply(RemoveWarehousingProviderResponse);
      }
    });

    cy.visit('/');
    cy.get('button').contains(localizations.en.system).click({ force: true });
    cy.get('a[href="/warehousing-provider"]')
      .contains(localizations.en.warehousing_provider)
      .click({ force: true });

    cy.wait(fullAliasName(WarehousingProviderOperations.GetProvidersList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          type: null,
        });
        expect(response.body).to.deep.eq(WarehousingProvidersListResponse);
      },
    );

    cy.wait(fullAliasName(WarehousingProviderOperations.GetProvidersType)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq(WarehousingProvidersTypeResponse);
      },
    );
    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get('h2').should(
      'contain.text',
      localizations.en.warehousing_provider,
    );
  });

  it('Should Navigate to [WAREHOUSING PROVIDERS] page successfully', () => {
    cy.get('tr').should('have.length', 4);
  });

  it('Should [FILTER] list based on selected value', () => {
    const { options } =
      WarehousingProvidersTypeResponse.data.warehousingProviderType;
    const [firstOption] = options;

    cy.get('select#select-type').contains(localizations.en.filter_by_type);
    cy.get('select#select-type').select(firstOption.value);

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/warehousing-provider');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        type: firstOption.value,
      });
    });

    cy.wait(
      fullAliasName(
        WarehousingProviderOperations.GetPickUpWarehousingProviders,
      ),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        type: firstOption.value,
      });
      expect(response.body).to.deep.eq(WarehousingProvidersListResponse);
    });

    cy.location('pathname').should('eq', '/warehousing-provider');
  });

  it('Should Navigate to [NEW WAREHOUSING PROVIDER] form page successfully', () => {
    cy.get('a[href="/warehousing-provider/new"]')
      .should('contain.text', localizations.en.add)
      .click();
    cy.location('pathname').should('eq', '/warehousing-provider/new');
    cy.wait(fullAliasName(WarehousingProviderOperations.GetInterfaces)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          providerType: 'PHYSICAL',
        });
        expect(response.body).to.deep.eq(WarehousingProviderInterfacesResponse);
      },
    );

    cy.get('h2').should(
      'contain.text',
      localizations.en.new_warehousing_provider_header,
    );
  });

  it('Should [ADD NEW WAREHOUSING PROVIDER]  successfully', () => {
    const [firstPickUpInterface] =
      WarehousingProviderInterfacesResponse.data.warehousingInterfaces;
    const { options } =
      WarehousingProvidersTypeResponse.data.warehousingProviderType;
    const [firstType] = options;

    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get('a[href="/warehousing-provider/new"]')
      .should('contain.text', localizations.en.add)
      .click();
    cy.location('pathname').should('eq', '/warehousing-provider/new');

    cy.get('h2').should(
      'contain.text',
      localizations.en.new_warehousing_provider_header,
    );
    cy.get('select#type').select(firstType.value);

    cy.get('select#adapterKey').select(firstPickUpInterface.value);
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.create_provider}"]`,
    )
      .should('have.value', localizations.en.create_provider)
      .click();

    cy.wait(
      fullAliasMutationName(WarehousingProviderOperations.CreateProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProvider: {
          adapterKey: firstPickUpInterface._id,
          type: firstType.value,
        },
      });
      expect(response.body).to.deep.eq(CreateWarehousingProviderResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/warehousing-provider?warehousingProviderId=${CreateWarehousingProviderResponse.data.createWarehousingProvider._id}`,
    );
  });

  it('Should [ERROR] when required fields are not provided in new warehousing provider', () => {
    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get('a[href="/warehousing-provider/new"]')
      .should('contain.text', localizations.en.add)
      .click();

    cy.location('pathname').should('eq', '/warehousing-provider/new');
    cy.get('h2').should(
      'contain.text',
      localizations.en.new_warehousing_provider_header,
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

    cy.location('pathname').should('eq', '/warehousing-provider/new');
  });

  it('Should [INITIALIZE WAREHOUSING PROVIDER] successfully', () => {
    const { warehousingProvider } = SingleWarehousingProviderResponse.data;

    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get(
      `a[href="/warehousing-provider?warehousingProviderId=${warehousingProvider._id}"]`,
    ).click();

    cy.wait(
      fullAliasName(WarehousingProviderOperations.GetSingleProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProviderId: warehousingProvider._id,
      });
      expect(response.body).to.deep.eq(SingleWarehousingProviderResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/warehousing-provider?warehousingProviderId=${warehousingProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_warehousing_provider_header,
    );

    cy.get('textarea#configuration').should(
      'have.value',
      JSON.stringify(warehousingProvider.configuration || {}, null, 2),
    );
  });

  it('Should [UPDATE DELIVERY PROVIDER] successfully', () => {
    const { warehousingProvider } = SingleWarehousingProviderResponse.data;

    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get(
      `a[href="/warehousing-provider?warehousingProviderId=${warehousingProvider._id}"]`,
    ).click();

    cy.wait(
      fullAliasName(WarehousingProviderOperations.GetSingleProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProviderId: warehousingProvider._id,
      });
      expect(response.body).to.deep.eq(SingleWarehousingProviderResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/warehousing-provider?warehousingProviderId=${warehousingProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_warehousing_provider_header,
    );

    cy.get('textarea#configuration')
      .clear()
      .type(JSON.stringify(warehousingProvider.configuration || {}, null, 2))
      .blur();

    cy.get(
      `input[type="submit"][aria-label="${localizations.en.update_configuration}"]`,
    )
      .should('have.value', localizations.en.update_configuration)
      .click();

    cy.wait(
      fullAliasMutationName(WarehousingProviderOperations.UpdateProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProvider: {
          configuration: warehousingProvider.configuration,
        },
        warehousingProviderId: warehousingProvider._id,
      });
      expect(response.body).to.deep.eq(UpdateWarehousingProviderResponse);
    });

    cy.location('pathname').should('eq', '/warehousing-provider');
  });

  it('Should [ERROR] when pattern of configuration fields are not correct in update warehousing provider', () => {
    const { warehousingProvider } = SingleWarehousingProviderResponse.data;

    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get(
      `a[href="/warehousing-provider?warehousingProviderId=${warehousingProvider._id}"]`,
    ).click();

    cy.wait(
      fullAliasName(WarehousingProviderOperations.GetSingleProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProviderId: warehousingProvider._id,
      });
      expect(response.body).to.deep.eq(SingleWarehousingProviderResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/warehousing-provider?warehousingProviderId=${warehousingProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_warehousing_provider_header,
    );

    cy.get('textarea#configuration').type('l').blur();

    cy.get(
      `input[type="submit"][aria-label="${localizations.en.update_configuration}"]`,
    )
      .should('have.value', localizations.en.update_configuration)
      .should('be.disabled');
  });

  it('Should [DELETE WAREHOUSING PROVIDER] successfully', () => {
    const { warehousingProvider } = SingleWarehousingProviderResponse.data;

    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get(
      `a[href="/warehousing-provider?warehousingProviderId=${warehousingProvider._id}"]`,
    ).click();

    cy.wait(
      fullAliasName(WarehousingProviderOperations.GetSingleProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProviderId: warehousingProvider._id,
      });
      expect(response.body).to.deep.eq(SingleWarehousingProviderResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/warehousing-provider?warehousingProviderId=${warehousingProvider._id}`,
    );
    cy.get('h2').should(
      'contain.text',
      localizations.en.update_warehousing_provider_header,
    );

    cy.get('button[type="button"]').contains(localizations.en.delete).click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_warehousing_provider)
      .click();

    cy.wait(
      fullAliasMutationName(WarehousingProviderOperations.RemoveProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProviderId: warehousingProvider._id,
      });
      expect(response.body).to.deep.eq(RemoveWarehousingProviderResponse);
    });

    cy.location('pathname').should('eq', '/warehousing-provider');
  });

  it('Should [DELETE WAREHOUSING PROVIDER FROM LIST] successfully', () => {
    const { warehousingProvider } = SingleWarehousingProviderResponse.data;

    cy.location('pathname').should('eq', '/warehousing-provider');
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_warehousing_provider)
      .click();

    cy.wait(
      fullAliasMutationName(WarehousingProviderOperations.RemoveProvider),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        warehousingProviderId: warehousingProvider._id,
      });
      expect(response.body).to.deep.eq(RemoveWarehousingProviderResponse);
    });

    cy.location('pathname').should('eq', '/warehousing-provider');
  });
});
