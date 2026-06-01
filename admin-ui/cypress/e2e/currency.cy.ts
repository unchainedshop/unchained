import localizations from '../../src/i18n';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import {
  CreateCurrencyResponse,
  CurrencyListResponse,
  CurrencyOperations,
  RemoveCurrencyResponse,
  SingleCurrencyResponse,
  UpdateCurrencyResponse,
} from '../mock/currency';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Currencies', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, CurrencyOperations.GetCurrencyList)) {
        aliasQuery(req, CurrencyOperations.GetCurrencyList);
        req.reply(CurrencyListResponse);
      }
      if (hasOperationName(req, CurrencyOperations.GetSingleCurrency)) {
        aliasQuery(req, CurrencyOperations.GetSingleCurrency);
        req.reply(SingleCurrencyResponse);
      }
      if (hasOperationName(req, CurrencyOperations.CreateCurrency)) {
        aliasMutation(req, CurrencyOperations.CreateCurrency);
        req.reply(CreateCurrencyResponse);
      }
      if (hasOperationName(req, CurrencyOperations.UpdateCurrency)) {
        aliasMutation(req, CurrencyOperations.UpdateCurrency);
        req.reply(UpdateCurrencyResponse);
      }
      if (hasOperationName(req, CurrencyOperations.RemoveCurrency)) {
        aliasMutation(req, CurrencyOperations.RemoveCurrency);
        req.reply(RemoveCurrencyResponse);
      }
    });
    cy.visit('/');
    cy.get('button').contains(localizations.en.system).click({ force: true });
    cy.get('a[href="/currency/"]')
      .contains(localizations.en.currencies)
      .click({ force: true });

    cy.wait(fullAliasName(CurrencyOperations.GetCurrencyList)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq(CurrencyListResponse);
      },
    );

    cy.get('h2').should('be.visible');
  });

  it('Show [DISPLAY CURRENCY] page successfully', () => {
    cy.location('pathname').should('eq', '/currency/');
    cy.get('tr').should('have.length', 4);
  });

  it('Toggling status  toggle should update route', () => {
    cy.location('pathname').should('eq', '/currency/');
    cy.get('button#includeInactive[role="switch"]').click();
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/currency/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'false',
      });
    });
    cy.get('button#includeInactive[role="switch"]').click();
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/currency/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'true',
      });
    });
  });

  it('Should update data and route when [SEARCHING] accordingly', () => {
    cy.location('pathname').should('eq', '/currency/');
    cy.get('input[type="search"]').type('search');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/currency/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search',
      });
    });

    cy.get('input[type="search"]').type(' input');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/currency/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search input',
      });
    });
  });

  it('Should [FILTER] with multiple keys [SEARCH, STATUS]', () => {
    cy.location('pathname').should('eq', '/currency/');

    cy.get('button#includeInactive[role="switch"]').click();
    cy.location().should((loc) => {
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'false',
      });
    });

    cy.get('input[type="search"]').type('search');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/currency/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search',
        includeInactive: 'false',
      });
    });
  });

  it('Show Navigate to [NEW CURRENCY] form page successfully', () => {
    cy.location('pathname').should('eq', '/currency/');
    cy.get('a[href="/currency/new/"]').click();
    cy.get('h2').should('contain.text', localizations.en.new_currency_header);
    cy.location('pathname').should('eq', '/currency/new/');
  });

  it('Show [ADD CURRENCY]  successfully', () => {
    cy.location('pathname').should('eq', '/currency/');
    cy.get('a[href="/currency/new/"]').click();
    cy.get('h2').should('contain.text', localizations.en.new_currency_header);
    cy.location('pathname').should('eq', '/currency/new/');
    cy.get('input#isoCode').type('de');
    cy.get('input[type="submit"]')
      .contains(localizations.en.add_currency)
      .click();

    cy.wait(fullAliasMutationName(CurrencyOperations.CreateCurrency)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables.currency.isoCode).to.eq('de');
        expect(currentSubject.request.body.variables.currency.decimals).to.eq(2);
        expect(currentSubject.response.body).to.deep.eq(
          CreateCurrencyResponse,
        );
      },
    );

    cy.url().should(
      'include',
      `/currency/?currencyId=${CreateCurrencyResponse.data.createCurrency._id}`,
    );
  });

  it('Show [ADD TOKEN as CURRENCY]  successfully', () => {
    cy.location('pathname').should('eq', '/currency/');
    cy.get('a[href="/currency/new/"]').click();
    cy.get('h2').should('contain.text', localizations.en.new_currency_header);
    cy.location('pathname').should('eq', '/currency/new/');
    cy.get('input#isoCode').type('de');
    cy.get('input#contractAddress').type(
      '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    );
    cy.get('input[type="submit"]')
      .contains(localizations.en.add_currency)
      .click();

    cy.wait(fullAliasMutationName(CurrencyOperations.CreateCurrency)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          currency: {
            isoCode: 'de',
            contractAddress: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
            decimals: 2,
          },
        });
        expect(currentSubject.response.body).to.deep.eq(
          CreateCurrencyResponse,
        );
      },
    );
    cy.url().should(
      'include',
      `/currency/?currencyId=${CreateCurrencyResponse.data.createCurrency._id}`,
    );
  });

  it('Show [ERROR] when required fields are not provided in add currency', () => {
    cy.location('pathname').should('eq', '/currency/');
    cy.get('a[href="/currency/new/"]').click();
    cy.location('pathname').should('eq', '/currency/new/');
    cy.get('input[type="submit"]')
      .contains(localizations.en.add_currency)
      .click();

    cy.get('label[for="isoCode"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.iso_code,
      ),
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.add_currency)
      .should('be.disabled');
  });

  it('Show [INITIALIZE CURRENCY] successfully', () => {
    const { currency } = SingleCurrencyResponse.data;

    cy.location('pathname').should('eq', '/currency/');

    cy.get('tr')
      .contains(currency.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.edit).click();

    cy.url().should('include', `/currency/?currencyId=${currency._id}`);
    cy.wait(fullAliasName(CurrencyOperations.GetSingleCurrency)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          currencyId: currency._id,
        });
        expect(response.body).to.deep.eq(SingleCurrencyResponse);
      },
    );

    cy.get('input#isoCode').should('have.value', currency.isoCode);
    cy.get('input#contractAddress').should(
      'have.value',
      currency.contractAddress,
    );
  });

  it('Show [UPDATE CURRENCY] successfully', () => {
    const { currency } = SingleCurrencyResponse.data;

    cy.location('pathname').should('eq', '/currency/');
    cy.get('tr')
      .contains(currency.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.edit).click();
    cy.url().should('include', `/currency/?currencyId=${currency._id}`);
    cy.wait(fullAliasName(CurrencyOperations.GetSingleCurrency)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          currencyId: currency._id,
        });
        expect(response.body).to.deep.eq(SingleCurrencyResponse);
      },
    );
    cy.get('input#contractAddress')
      .clear()
      .type('0x26b3E189B7DEE08EB86cCc698abc9D33980e39c6');
    cy.get('input[type="submit"]')
      .contains(localizations.en.update_currency)
      .click();

    cy.wait(fullAliasMutationName(CurrencyOperations.UpdateCurrency)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          currency: {
            contractAddress: '0x26b3E189B7DEE08EB86cCc698abc9D33980e39c6',
            isoCode: currency.isoCode,
            isActive: currency.isActive,
            decimals: currency.decimals,
          },
          currencyId: currency._id,
        });
        expect(currentSubject.response.body).to.deep.eq(
          UpdateCurrencyResponse,
        );
      },
    );
    cy.url().should(
      'include',
      `/currency/?currencyId=${SingleCurrencyResponse.data.currency._id}`,
    );
  });

  it('Show [ERROR] when pattern of contract address fields are not correct in update currency', () => {
    const { currency } = SingleCurrencyResponse.data;

    cy.location('pathname').should('eq', '/currency/');

    cy.get('tr')
      .contains(currency.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.edit).click();
    cy.url().should('include', `/currency/?currencyId=${currency._id}`);
    cy.get('input#contractAddress')
      .clear()
      .type('0x26b3E189B7DEE08EB86cCc698a');
    cy.get('input[type="submit"]')
      .contains(localizations.en.update_currency)
      .click();

    cy.get('label[for="contractAddress"]').should(
      'contain.text',
      localizations.en.error_contract_address,
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.update_currency)
      .should('be.disabled');
  });

  it('Show [DELETE CURRENCY] successfully', () => {
    const { currency } = SingleCurrencyResponse.data;

    cy.location('pathname').should('eq', '/currency/');
    cy.get('tr')
      .contains(currency.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.edit).click();
    cy.url().should('include', `/currency/?currencyId=${currency._id}`);
    cy.get('button')
      .contains(localizations.en.delete)
      .click();
    cy.get('button#danger_continue')
      .contains(localizations.en.delete_currency)
      .click();

    cy.wait(fullAliasMutationName(CurrencyOperations.RemoveCurrency)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          currencyId: currency._id,
        });
        expect(currentSubject.response.body).to.deep.eq(
          RemoveCurrencyResponse,
        );
      },
    );
    cy.location('pathname').should('eq', '/currency/');
  });

  it('Show [DELETE CURRENCY FROM LIST] successfully', () => {
    const { currency } = SingleCurrencyResponse.data;

    cy.location('pathname').should('eq', '/currency/');
    cy.get('tr')
      .contains(currency.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.delete).last().click();
    cy.get('button#danger_continue')
      .contains(localizations.en.delete_currency)
      .click();

    cy.wait(fullAliasMutationName(CurrencyOperations.RemoveCurrency)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          currencyId: currency._id,
        });
        expect(currentSubject.response.body).to.deep.eq(
          RemoveCurrencyResponse,
        );
      },
    );
    cy.location('pathname').should('eq', '/currency/');
  });
});
