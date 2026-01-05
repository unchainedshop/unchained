import localizations from '../../src/i18n';
import generateUniqueId from '../../src/modules/common/utils/getUniqueId';
import { getContent } from '../../src/modules/common/utils/utils';
import {
  AddAssortmentFilterResponse,
  AssortmentFiltersResponse,
  AssortmentListResponse,
  AssortmentOperation,
  assortmentequestVariables,
  FiltersListResponse,
  RemoveAssortmentFilterResponse,
  Singleassortmentesponse,
  TranslatedAssortmentTextsResponse,
} from '../mock/assortment';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Assortment Detail Filters', () => {
  const { assortment } = Singleassortmentesponse.data;
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, AssortmentOperation.GetAssortmentList)) {
        aliasQuery(req, AssortmentOperation.GetAssortmentList);
        req.reply(AssortmentListResponse);
      }
      if (hasOperationName(req, AssortmentOperation.GetSingleAssortment)) {
        aliasQuery(req, AssortmentOperation.GetSingleAssortment);
        req.reply(Singleassortmentesponse);
      }

      if (hasOperationName(req, AssortmentOperation.GetTranslatedTexts)) {
        aliasQuery(req, AssortmentOperation.GetTranslatedTexts);
        req.reply(TranslatedAssortmentTextsResponse);
      }
      if (hasOperationName(req, AssortmentOperation.FiltersList)) {
        aliasQuery(req, AssortmentOperation.FiltersList);
        req.reply(FiltersListResponse);
      }
      if (hasOperationName(req, AssortmentOperation.AssortmentFilters)) {
        aliasQuery(req, AssortmentOperation.AssortmentFilters);
        req.reply(AssortmentFiltersResponse);
      }
      if (hasOperationName(req, AssortmentOperation.AddFilter)) {
        aliasMutation(req, AssortmentOperation.AddFilter);
        req.reply(AddAssortmentFilterResponse);
      }
      if (hasOperationName(req, AssortmentOperation.RemoveFilter)) {
        aliasMutation(req, AssortmentOperation.RemoveFilter);
        req.reply(RemoveAssortmentFilterResponse);
      }
    });

    cy.viewport(1200, 800);
    cy.visit('/');
    cy.get('a[href="/assortments"]')
      .contains(localizations.en.assortments)
      .click({ force: true });

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(assortmentequestVariables);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );

    cy.location('pathname').should('eq', '/assortments');
    cy.get('h2').should(
      'contain.text',
      localizations.en.assortments,
    );

    cy.get(`a[href="/assortments?assortmentSlug=${generateUniqueId(assortment)}"]`)
      .contains(assortment?.texts?.title)
      .click();

    cy.wait(fullAliasName(AssortmentOperation.GetSingleAssortment)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(Singleassortmentesponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.GetTranslatedTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: Singleassortmentesponse.data.assortment._id,
        });
        expect(response.body).to.deep.eq(TranslatedAssortmentTextsResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/assortments?assortmentSlug=${generateUniqueId(assortment)}`,
    );
    cy.get('h2').within(() => {
      cy.get('span').should(
        'contain.text',
        getContent(
          replaceIntlPlaceholder(
            localizations.en.assortment,
            assortment._id,
            'id',
          ),
        ),
      );
    });

    cy.get('a#filters').contains(localizations.en.filters).click();

    cy.wait(fullAliasName(AssortmentOperation.FiltersList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          limit: 50,
          offset: 0,
          includeInactive: true,

          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(FiltersListResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.AssortmentFilters)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentFiltersResponse);
      },
    );
  });

  afterEach(() => {
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(
        `/assortments?assortmentSlug=${generateUniqueId(assortment)}`,
      );
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'filters',
      });
    });
  });
  it('Should Navigate to [ASSORTMENT DETAIL FILTERS] tab successfully', () => {
    cy.get('form#assortment_filter_form').should('be.visible');
    cy.get('button[aria-describedby="assortment-filter"]').should(
      'have.length',
      2,
    );
  });

  it('Should [ADD TAG] successfully', () => {
    cy.get('input#tags').clear().type('new');
    cy.get('button#add-tag').click();
    cy.get('span#badge').should('contain.text', 'new');
  });

  it('Should [REMOVE TAG] successfully', () => {
    cy.get('input#tags').clear().type('new');
    cy.get('button#add-tag').click();
    cy.get('span#badge').first().get('button#badge-x-button').click();
  });

  it('Should [SEARCH] filter successfully', () => {
    cy.get('input#react-select-2-input').clear().type('color');

    cy.wait(fullAliasName(AssortmentOperation.FiltersList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: 'color',
          limit: 50,
          offset: 0,
          includeInactive: true,

          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(FiltersListResponse);
      },
    );

    cy.get('div#react-select-2-listbox div:first').each(($div) => {
      cy.wrap($div).within(() => {
        cy.get('div').should('have.length', 2);
      });
    });
  });

  it('Should [ADD FILTER] successfully', () => {
    cy.get('input#tags').clear().type('new');
    cy.get('button#add-tag').click();

    cy.get('span#badge').should('contain.text', 'new');

    cy.get('input#react-select-2-input').clear().type('t');

    cy.wait(fullAliasName(AssortmentOperation.FiltersList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: 't',
          limit: 50,
          offset: 0,
          includeInactive: true,

          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(FiltersListResponse);
      },
    );
    cy.get('#react-select-2-option-0').click();
    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.wait(fullAliasMutationName(AssortmentOperation.AddFilter)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
          filterId: FiltersListResponse.data.filters[0]._id,
          tags: ['new'],
        });
        expect(response.body).to.deep.eq(AddAssortmentFilterResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.AssortmentFilters)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentFiltersResponse);
      },
    );
  });

  it('Should [ERROR] when required fields are not provided in add filter', () => {
    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.get('label[for="filterId"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.filter,
      ),
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.save)
      .should('be.disabled');
  });

  it('should [DELETE] filter successfully', () => {
    const { filterAssignments } = AssortmentFiltersResponse.data.assortment;

    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_filter)
      .click();

    cy.wait(fullAliasMutationName(AssortmentOperation.RemoveFilter)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentFilterId: filterAssignments[0]._id,
        });
        expect(response.body).to.deep.eq(RemoveAssortmentFilterResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.AssortmentFilters)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentFiltersResponse);
      },
    );
  });

  it('Should [CANCEL DELETE] filter successfully', () => {
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_cancel')
      .contains(localizations.en.cancel)
      .click();
  });
});
