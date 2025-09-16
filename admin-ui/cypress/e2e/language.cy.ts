import localizations from '../../src/i18n';
import {
  CreateLanguageResponse,
  LanguageOperations,
  LanguagesResponse,
  RemoveLanguageResponse,
  SingleLanguageResponse,
  UpdateLanguageResponse,
} from '../mock/language';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';

describe('Languages', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, LanguageOperations.GetLanguagesList)) {
        aliasQuery(req, LanguageOperations.GetLanguagesList);
        req.reply(LanguagesResponse);
      }
      if (hasOperationName(req, LanguageOperations.GetSingleLanguage)) {
        aliasQuery(req, LanguageOperations.GetSingleLanguage);
        req.reply(SingleLanguageResponse);
      }
      if (hasOperationName(req, LanguageOperations.CreateLanguage)) {
        aliasMutation(req, LanguageOperations.CreateLanguage);
        req.reply(CreateLanguageResponse);
      }
      if (hasOperationName(req, LanguageOperations.UpdateLanguage)) {
        aliasMutation(req, LanguageOperations.UpdateLanguage);
        req.reply(UpdateLanguageResponse);
      }
      if (hasOperationName(req, LanguageOperations.RemoveLanguage)) {
        aliasMutation(req, LanguageOperations.RemoveLanguage);
        req.reply(RemoveLanguageResponse);
      }
    });
    cy.visit('/');
    cy.get('button').contains(localizations.en.system).click({ force: true });
    cy.get('a[href="/language"]')
      .contains(localizations.en.languages)
      .click({ force: true });
    cy.get('h2').should('contain.text', localizations.en.languages);
    cy.wait(fullAliasName(LanguageOperations.GetLanguagesList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeInactive: true,
          limit: 50,
          offset: 0,
          queryString: '',
          sort: [],
        });

        expect(response.body).to.deep.eq(LanguagesResponse);
      },
    );
    cy.location('pathname').should('eq', '/language');
  });

  it('Show Navigate to [LANGUAGES] page successfully', () => {
    cy.location('pathname').should('eq', '/language');
    cy.get('tr').should('have.length', 4);
  });

  it('Toggling active status should update route accordingly', () => {
    cy.location('pathname').should('eq', '/language');
    cy.get('button[role="switch"]').click();
    cy.wait(fullAliasName(LanguageOperations.GetLanguagesList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeInactive: false,
          limit: 50,
          offset: 0,
          queryString: '',
          sort: [],
        });
        expect(response.body).to.deep.eq(LanguagesResponse);
      },
    );
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq('/language');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'false',
      });
    });

    cy.get('button[role="switch"]').click();
    cy.wait(100);

    cy.location().then((loc) => {
      expect(loc.pathname).to.eq('/language');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'true',
      });
    });
  });

  it('Should update data and route accordingly when [SEARCHING]', () => {
    cy.location('pathname').should('eq', '/language');

    cy.get('input[type="search"]').type('search');
    cy.wait(fullAliasName(LanguageOperations.GetLanguagesList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeInactive: true,
          limit: 50,
          offset: 0,
          queryString: 'search',
          sort: [],
        });
        expect(response.body).to.deep.eq(LanguagesResponse);
      },
    );
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq('/language');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search',
      });
    });
    cy.get('input[type="search"]').type(' input');
    cy.wait(fullAliasName(LanguageOperations.GetLanguagesList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeInactive: true,
          limit: 50,
          offset: 0,
          queryString: 'search input',
          sort: [],
        });
        expect(response.body).to.deep.eq(LanguagesResponse);
      },
    );
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq('/language');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search input',
      });
    });
  });

  it('Should update data and route accordingly when [SEARCHING]', () => {
    cy.location('pathname').should('eq', '/language');

    cy.get('button[role="switch"]').click();
    cy.wait(fullAliasName(LanguageOperations.GetLanguagesList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeInactive: false,
          limit: 50,
          offset: 0,
          queryString: '',
          sort: [],
        });
        expect(response.body).to.deep.eq(LanguagesResponse);
      },
    );
    cy.get('input[type="search"]').type('search');
    cy.wait(fullAliasName(LanguageOperations.GetLanguagesList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeInactive: false,
          limit: 50,
          offset: 0,
          queryString: 'search',
          sort: [],
        });
        expect(response.body).to.deep.eq(LanguagesResponse);
      },
    );
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq('/language');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'false',
        queryString: 'search',
      });
    });
  });

  it('Show Navigate to [NEW LANGUAGE] form page successfully', () => {
    cy.location('pathname').should('eq', '/language');
    cy.get('a[href="/language/new"]').click();
    cy.location('pathname').should('eq', '/language/new');
    cy.get('h2').should('contain.text', localizations.en.new_language_header);
  });

  it('Show [ADD LANGUAGE]  successfully', () => {
    cy.location('pathname').should('eq', '/language');
    cy.get('a[href="/language/new"]').click();

    cy.location('pathname').should('eq', '/language/new');
    cy.get('h2').should('contain.text', localizations.en.new_language_header);
    cy.get('input#isoCode').type('de');
    cy.get('input[type="submit"]')
      .contains(localizations.en.add_language)
      .click();

    cy.wait(fullAliasMutationName(LanguageOperations.CreateLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          language: {
            isoCode: 'de',
          },
        });
        expect(currentSubject.response.body).to.deep.eq(CreateLanguageResponse);
      },
    );
    cy.location('pathname').should(
      'eq',
      `/language?languageId=${CreateLanguageResponse.data.createLanguage._id}`,
    );
  });

  it('Show [ERROR] when required fields are not provided in add language', () => {
    cy.location('pathname').should('eq', '/language');
    cy.get('a[href="/language/new"]').click();
    cy.location('pathname').should('eq', '/language/new');
    cy.get('h2').should('contain.text', localizations.en.new_language_header);
    cy.get('input[type="submit"]')
      .contains(localizations.en.add_language)
      .click();

    cy.get('label[for="isoCode"]').should(
      'contain.text',
      localizations.en.error_language_code,
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.add_language)
      .should('be.disabled');
  });

  it('Show [INITIALIZE LANGUAGE] successfully', () => {
    const { language } = SingleLanguageResponse.data;

    cy.location('pathname').should('eq', '/language');
    cy.get(`a[href="/language?languageId=${language._id}"]`).click();
    cy.location('pathname').should('eq', `/language?languageId=${language._id}`);
    cy.wait(fullAliasName(LanguageOperations.GetSingleLanguage)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          languageId: language._id,
        });
        expect(response.body).to.deep.eq(SingleLanguageResponse);
      },
    );
    cy.get('input#isoCode').should('have.value', language.isoCode);
    cy.get('input[type="checkbox"]#isActive');
  });

  it('Show [UPDATE LANGUAGE] successfully', () => {
    const { language } = SingleLanguageResponse.data;
    cy.location('pathname').should('eq', '/language');
    cy.get(`a[href="/language?languageId=${language._id}"]`).click();
    cy.location('pathname').should('eq', `/language?languageId=${language._id}`);
    cy.get('input[type="checkbox"]#isActive').uncheck();
    cy.get('input[type="submit"]')
      .contains(localizations.en.update_language)
      .click();

    cy.wait(fullAliasMutationName(LanguageOperations.UpdateLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          language: {
            isoCode: language.isoCode,
            isActive: false,
          },
          languageId: language._id,
        });
        expect(currentSubject.response.body).to.deep.eq(UpdateLanguageResponse);
      },
    );
    cy.location('pathname').should(
      'eq',
      `/language?languageId=${UpdateLanguageResponse.data.updateLanguage._id}`,
    );
  });

  it('Show [DELETE LANGUAGE] successfully', () => {
    const { language } = SingleLanguageResponse.data;

    cy.location('pathname').should('eq', '/language');
    cy.get(`a[href="/language?languageId=${language._id}"]`).click();
    cy.location('pathname').should('eq', `/language?languageId=${language._id}`);
    cy.get('input[type="checkbox"]#isActive');
    cy.get('[aria-label="true"]').should('not.to.be', undefined);
    cy.get('button[type="button"]').contains(localizations.en.delete).click();
    cy.get('[aria-label="true"]').should('to.be', undefined);
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_language)
      .click();
    cy.location('pathname').should('eq', '/language');

    cy.wait(fullAliasMutationName(LanguageOperations.RemoveLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          languageId: language._id,
        });
        expect(currentSubject.response.body).to.deep.eq(RemoveLanguageResponse);
      },
    );
    cy.location('pathname').should('eq', '/language');
  });

  it('Show [DELETE LANGUAGE FROM LIST] successfully', () => {
    const { language } = SingleLanguageResponse.data;

    cy.location('pathname').should('eq', '/language');
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('[aria-label="true"]').should('not.to.be', undefined);
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_language)
      .click();
    cy.get('[aria-label="true"]').should('to.be', undefined);
    cy.location('pathname').should('eq', '/language');

    cy.wait(fullAliasMutationName(LanguageOperations.RemoveLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          languageId: language._id,
        });
        expect(currentSubject.response.body).to.deep.eq(RemoveLanguageResponse);
      },
    );
    cy.location('pathname').should('eq', '/language');
  });
});
