import localizations from '../../src/i18n';
import generateUniqueId from '../../src/modules/common/utils/getUniqueId';
import { getContent } from '../../src/modules/common/utils/utils';
import {
  AddAssortmentLinkResponse,
  AssortmentLinksResponse,
  AssortmentListResponse,
  AssortmentOperation,
  AssortmentPathsResponse,
  assortmentequestVariables,
  RemoveAssortmentLinkResponse,
  Singleassortmentesponse,
  TranslatedAssortmentTextsResponse,
} from '../mock/assortment';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

const assortmentFilterQuery = {
  queryString: '',
  tags: null,
  slugs: null,
  limit: 50,
  offset: 0,
  includeInactive: true,
  includeLeaves: true,
  sort: [
    {
      key: 'created',
      value: 'DESC',
    },
  ],
};

describe('Assortment Detail Links', () => {
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
      if (hasOperationName(req, AssortmentOperation.GetAssortmentLinks)) {
        aliasQuery(req, AssortmentOperation.GetAssortmentLinks);
        req.reply(AssortmentLinksResponse);
      }

      if (hasOperationName(req, AssortmentOperation.AddAssortmentLink)) {
        aliasMutation(req, AssortmentOperation.AddAssortmentLink);
        req.reply(AddAssortmentLinkResponse);
      }
      if (hasOperationName(req, AssortmentOperation.RemoveAssortmentLink)) {
        aliasMutation(req, AssortmentOperation.RemoveAssortmentLink);
        req.reply(RemoveAssortmentLinkResponse);
      }

      if (hasOperationName(req, AssortmentOperation.GetAssortmentPaths)) {
        aliasQuery(req, AssortmentOperation.GetAssortmentPaths);
        req.reply(AssortmentPathsResponse);
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

    cy.get('a#links').contains(localizations.en.links).click();

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentLinks)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentLinksResponse);
      },
    );
  });

  afterEach(() => {
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(
        `/assortments?assortmentSlug=${generateUniqueId(assortment)}`,
      );
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'links',
      });
    });
  });

  it('Should Navigate to [ASSORTMENT DETAIL LINKS] tab successfully', () => {
    cy.get('form#assortment_link_form').should('be.visible');
    cy.get('button[aria-describedBy="assortment-link"]').should(
      'have.length',
      3,
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

  it('Should [SEARCH] assortment successfully', () => {
    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(assortmentFilterQuery);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );
    cy.get('input#react-select-2-input').clear().type('s');

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          ...assortmentFilterQuery,
          includeLeaves: true,
          queryString: 's',
        });
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );
  });

  it('Should [ADD ASSORTMENT LINK] successfully', () => {
    const { assortments } = AssortmentListResponse.data;
    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(assortmentFilterQuery);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );

    cy.get('input#react-select-2-input').clear().type('s');

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          ...assortmentFilterQuery,
          queryString: 's',
        });
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );

    cy.get('#react-select-2-option-1').click();
    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.wait(fullAliasMutationName(AssortmentOperation.AddAssortmentLink)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          parentAssortmentId: assortment._id,
          childAssortmentId: assortments[2]._id,
          tags: null,
        });
        expect(response.body).to.deep.eq(AddAssortmentLinkResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentLinks)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentLinksResponse);
      },
    );
  });

  it('Should [ERROR] when required fields are not provided in add sub-assortment link', () => {
    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.get('label[for="childAssortmentId"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.child_assortment,
      ),
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.save)
      .should('be.disabled');
  });

  it('should [DELETE] sub-assortment successfully', () => {
    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(assortmentFilterQuery);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_link)
      .click();

    cy.wait(
      fullAliasMutationName(AssortmentOperation.RemoveAssortmentLink),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        assortmentLinkId: '7336cc61081c8b0e770dca64',
      });
      expect(response.body).to.deep.eq(RemoveAssortmentLinkResponse);
    });

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentLinks)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentLinksResponse);
      },
    );
  });

  it('Should [CANCEL DELETE] sub-assortment successfully', () => {
    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(assortmentFilterQuery);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_cancel')
      .contains(localizations.en.cancel)
      .click();
  });
});
