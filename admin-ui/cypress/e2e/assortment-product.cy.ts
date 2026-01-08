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
  limit: 50,
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

    cy.get('a#products').contains(localizations.en.products).click();

    cy.wait(fullAliasName(AssortmentOperation.AssortmentProducts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentProductsResponse);
      },
    );
  });

  afterEach(() => {
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(
        `/assortments?assortmentSlug=${generateUniqueId(assortment)}`,
      );
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
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
    cy.get('input#tags').clear().type('new');
    cy.get('button#add-tag').click();
    cy.get('span#badge').should('contain.text', 'new');
  });

  it('Should [REMOVE TAG] successfully', () => {
    cy.get('input#tags').clear().type('new');
    cy.get('button#add-tag').click();
    cy.get('span#badge').first().get('button#badge-x-button').click();
  });

  it('Should [SEARCH] product successfully', () => {
    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(productSearchQuery);
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );
    cy.get('input#react-select-2-input').clear().type('f');

    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          ...productSearchQuery,
          queryString: 'f',
        });
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );

    cy.get('input#react-select-2-input').type('r');

    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          ...productSearchQuery,
          queryString: 'fr',
        });
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );
  });

  it('Should [ADD PRODUCT] successfully', () => {
    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(productSearchQuery);
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );
    cy.get('input#react-select-2-input').type('f');

    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          ...productSearchQuery,
          queryString: 'f',
        });
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );

    cy.get('#react-select-2-option-1').click();
    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.wait(fullAliasMutationName(AssortmentOperation.AddProduct)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
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
        expect(request.body.variables).to.deep.eq({
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
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_product)
      .click();

    cy.wait(fullAliasMutationName(AssortmentOperation.RemoveProduct)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentProductId: 'fee3ae6e702679cde6f0f1aa',
        });
        expect(response.body).to.deep.eq(RemoveAssortmentProductResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.AssortmentProducts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentProductsResponse);
      },
    );
  });

  it('Should [CANCEL DELETE] product successfully', () => {
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_cancel')
      .contains(localizations.en.cancel)
      .click();
  });
});
