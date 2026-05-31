import localizations from '../../src/i18n';
import generateUniqueId from '../../src/modules/common/utils/getUniqueId';
import { getContent } from '../../src/modules/common/utils/utils';
import {
  AddAssortmentProductResponse,
  AssortmentListResponse,
  AssortmentOperation,
  AssortmentProductsResponse,
  assortmentequestVariables,
  RemoveAssortmentProductResponse,
  Singleassortmentesponse,
  TranslatedAssortmentTextsResponse,
} from '../mock/assortment';
import { ProductListResponse, ProductOperations } from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

const productSearchQuery = {
  queryString: '',
  offset: 0,
  includeDrafts: true,
  tags: null,
  slugs: null,
  sort: [
    {
      key: 'created',
      value: 'DESC',
    },
  ],
};

describe('Assortment Detail Products', () => {
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
      if (hasOperationName(req, AssortmentOperation.AssortmentProducts)) {
        aliasQuery(req, AssortmentOperation.AssortmentProducts);
        req.reply(AssortmentProductsResponse);
      }

      if (hasOperationName(req, ProductOperations.GetProductList)) {
        aliasQuery(req, ProductOperations.GetProductList);
        req.reply(ProductListResponse);
      }

      if (hasOperationName(req, AssortmentOperation.GetTranslatedTexts)) {
        aliasQuery(req, AssortmentOperation.GetTranslatedTexts);
        req.reply(TranslatedAssortmentTextsResponse);
      }

      if (hasOperationName(req, AssortmentOperation.AddProduct)) {
        aliasMutation(req, AssortmentOperation.AddProduct);
        req.reply(AddAssortmentProductResponse);
      }
      if (hasOperationName(req, AssortmentOperation.RemoveProduct)) {
        aliasMutation(req, AssortmentOperation.RemoveProduct);
        req.reply(RemoveAssortmentProductResponse);
      }
    });

    cy.viewport(1200, 800);
    cy.visit('/');
    cy.get('a[href="/assortments/"]')
      .contains(localizations.en.assortments)
      .click({ force: true });

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include(assortmentequestVariables);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );

    cy.location('pathname').should('eq', '/assortments/');
    cy.get('h2').should(
      'contain.text',
      localizations.en.assortments,
    );

    cy.get(`a[href="/assortments/?assortmentSlug=${generateUniqueId(assortment)}"]`)
      .contains(assortment?.texts?.title)
      .click();

    cy.wait(fullAliasName(AssortmentOperation.GetSingleAssortment)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(Singleassortmentesponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.GetTranslatedTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          assortmentId: Singleassortmentesponse.data.assortment._id,
        });
        expect(response.body).to.deep.eq(TranslatedAssortmentTextsResponse);
      },
    );

    cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
    );
    cy.get('h2').should('contain.text', assortment?.texts?.title || 'Assortment');

    cy.get('a#products').contains(localizations.en.products).click();

    cy.wait(fullAliasName(AssortmentOperation.AssortmentProducts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentProductsResponse);
      },
    );
  });

  afterEach(() => {
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/assortments/');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        assortmentSlug: generateUniqueId(assortment),
        tab: 'products',
      });
    });
  });

  it('Should Navigate to [ASSORTMENT DETAIL PRODUCT] tab successfully', () => {
    cy.get('form#assortment_product_form').should('be.visible');
    cy.get('button[aria-describedBy="assortment-product"]').should(
      'have.length',
      4,
    );
  });

  it('Should [ADD TAG] successfully', () => {
    cy.get('input#tags').clear({ force: true }).type('new{enter}', { force: true });
    cy.get('span#badge').should('contain.text', 'new');
  });

  it('Should [REMOVE TAG] successfully', () => {
    cy.get('input#tags').clear({ force: true }).type('new{enter}', { force: true });
    cy.get('span#badge').contains('new').click();
  });

  it('Should [SEARCH] product successfully', () => {
    cy.wait(fullAliasName(ProductOperations.GetProductList));

    cy.get('input#productId').click({ force: true }).type('f', { delay: 100 });

    cy.get('[class*="react-select__option"]').should('have.length.gte', 1);
  });

  it('Should [ADD PRODUCT] successfully', () => {
    cy.wait(fullAliasName(ProductOperations.GetProductList));

    cy.get('input#productId').click({ force: true }).type('f', { delay: 100 });

    cy.get('[class*="react-select__option"]').should('have.length.gte', 2);
    cy.get('[class*="react-select__option"]').eq(1).click();
    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.wait(fullAliasMutationName(AssortmentOperation.AddProduct)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          productId: ProductListResponse.data.products[1]._id,
          assortmentId: assortment._id,
          tags: null,
        });
        expect(response.body).to.deep.eq(AddAssortmentProductResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.AssortmentProducts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentProductsResponse);
      },
    );
  });

  it('Should [ERROR] when required fields are not provided in add product', () => {
    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.get('label[for="productId"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.product,
      ),
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.save)
      .should('be.disabled');
  });

  it('should [DELETE] product successfully', () => {
    cy.get('button[aria-label="Actions menu"]').first().click({ force: true });
    cy.get('.fixed.w-48 button').contains(localizations.en.delete).click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_product)
      .click();

    cy.wait(fullAliasMutationName(AssortmentOperation.RemoveProduct)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          assortmentProductId: 'fee3ae6e702679cde6f0f1aa',
        });
        expect(response.body).to.deep.eq(RemoveAssortmentProductResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.AssortmentProducts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentProductsResponse);
      },
    );
  });

  it('Should [CANCEL DELETE] product successfully', () => {
    cy.get('button[aria-label="Actions menu"]').first().click({ force: true });
    cy.get('.fixed.w-48 button').contains(localizations.en.delete).click();
    cy.get('button[type="button"]#danger_cancel')
      .contains(localizations.en.cancel)
      .click();
  });
});
