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
    cy.get('a[href="/language/"]')
      .contains(localizations.en.languages)
      .click({ force: true });
    cy.get('h2').should('be.visible');
    cy.location('pathname').should('eq', '/language/');
  });

  it('Show Navigate to [LANGUAGES] page successfully', () => {
    cy.location('pathname').should('eq', '/language/');
    cy.get('tr').should('have.length', 4);
  });

  it('Toggling active status should update route accordingly', () => {
    cy.location('pathname').should('eq', '/language/');
    cy.get('button#includeInactive[role="switch"]').click();
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/language/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'false',
      });
    });

    cy.get('button#includeInactive[role="switch"]').click();
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/language/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'true',
      });
    });
  });

  it('Should update data and route accordingly when [SEARCHING]', () => {
    cy.location('pathname').should('eq', '/language/');

    cy.get('input[type="search"]').type('search');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/language/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search',
      });
    });

    cy.get('input[type="search"]').type(' input');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/language/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search input',
      });
    });
  });

  it('Should [FILTER] with multiple fields [STATUS & SEARCH]', () => {
    cy.location('pathname').should('eq', '/language/');

    cy.get('button#includeInactive[role="switch"]').click();
    cy.location().should((loc) => {
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'false',
      });
    });

    cy.get('input[type="search"]').type('search');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/language/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeInactive: 'false',
        queryString: 'search',
      });
    });
  });

  it('Show Navigate to [NEW LANGUAGE] form page successfully', () => {
    cy.location('pathname').should('eq', '/language/');
    cy.get('a[href="/language/new/"]').click();
    cy.location('pathname').should('eq', '/language/new/');
    cy.get('h2').should('contain.text', localizations.en.new_language_header);
  });

  it('Show [ADD LANGUAGE]  successfully', () => {
    cy.location('pathname').should('eq', '/language/');
    cy.get('a[href="/language/new/"]').click();

    cy.location('pathname').should('eq', '/language/new/');
    cy.get('h2').should('contain.text', localizations.en.new_language_header);
    cy.get('input#isoCode').type('de');
    cy.get('input[type="submit"]')
      .contains(localizations.en.add_language)
      .click();

    cy.wait(fullAliasMutationName(LanguageOperations.CreateLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          language: {
            isoCode: 'de',
          },
        });
        expect(currentSubject.response.body).to.deep.eq(
          CreateLanguageResponse,
        );
      },
    );
    cy.url().should(
      'include',
      `/language/?languageId=${CreateLanguageResponse.data.createLanguage._id}`,
    );
  });

  it('Show [ERROR] when required fields are not provided in add language', () => {
    cy.location('pathname').should('eq', '/language/');
    cy.get('a[href="/language/new/"]').click();
    cy.location('pathname').should('eq', '/language/new/');
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

    cy.location('pathname').should('eq', '/language/');
    cy.get('tr')
      .contains(language.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.edit).click();
    cy.url().should('include', `/language/?languageId=${language._id}`);
    cy.wait(fullAliasName(LanguageOperations.GetSingleLanguage)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          languageId: language._id,
        });
        expect(response.body).to.deep.eq(SingleLanguageResponse);
      },
    );
    cy.get('input#isoCode').should('have.value', language.isoCode);
  });

  it('Show [UPDATE LANGUAGE] successfully', () => {
    const { language } = SingleLanguageResponse.data;
    cy.location('pathname').should('eq', '/language/');
    cy.get('tr')
      .contains(language.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.edit).click();
    cy.url().should('include', `/language/?languageId=${language._id}`);
    cy.get('input[type="submit"]')
      .contains(localizations.en.update_language)
      .click();

    cy.wait(fullAliasMutationName(LanguageOperations.UpdateLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          language: {
            isoCode: language.isoCode,
            isActive: language.isActive,
          },
          languageId: language._id,
        });
        expect(currentSubject.response.body).to.deep.eq(
          UpdateLanguageResponse,
        );
      },
    );
    cy.url().should(
      'include',
      `/language/?languageId=${UpdateLanguageResponse.data.updateLanguage._id}`,
    );
  });

  it('Show [DELETE LANGUAGE] successfully', () => {
    const { language } = SingleLanguageResponse.data;

    cy.location('pathname').should('eq', '/language/');
    cy.get('tr')
      .contains(language.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.edit).click();
    cy.url().should('include', `/language/?languageId=${language._id}`);
    cy.get('button[aria-describedby="header-delete-button"]')
      .contains(localizations.en.delete)
      .click();
    cy.get('button#danger_continue')
      .contains(localizations.en.delete_language)
      .click();

    cy.wait(fullAliasMutationName(LanguageOperations.RemoveLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          languageId: language._id,
        });
        expect(currentSubject.response.body).to.deep.eq(
          RemoveLanguageResponse,
        );
      },
    );
    cy.location('pathname').should('eq', '/language/');
  });

  it('Show [DELETE LANGUAGE FROM LIST] successfully', () => {
    const { language } = SingleLanguageResponse.data;

    cy.location('pathname').should('eq', '/language/');
    cy.get('tr')
      .contains(language.isoCode)
      .parents('tr')
      .find('button[aria-label]')
      .first()
      .click({ force: true });
    cy.get('button').contains(localizations.en.delete).last().click();
    cy.get('button#danger_continue')
      .contains(localizations.en.delete_language)
      .click();

    cy.wait(fullAliasMutationName(LanguageOperations.RemoveLanguage)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.include({
          languageId: language._id,
        });
        expect(currentSubject.response.body).to.deep.eq(
          RemoveLanguageResponse,
        );
      },
    );
    cy.location('pathname').should('eq', '/language/');
  });
});
