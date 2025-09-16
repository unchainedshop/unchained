import localizations from '../../src/i18n';
import { parseUniqueId } from '../../src/modules/common/utils/getUniqueId';

import {
  ACTIVE_PRODUCT_SLUG,
  AddProductAssignmentResponse,
  ProductAssignmentsResponse,
  ProductFilterRequest,
  ProductListResponse,
  ProductOperations,
  RemoveProductAssignmentResponse,
  SearchProductResponse,
  TranslatedProductTextResponse,
} from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';

describe('Product Assignment', () => {
  const product = ProductListResponse.data.products.find(
    ({ _id }) => _id === parseUniqueId(ACTIVE_PRODUCT_SLUG),
  );
  const CurrentProductResponse = {
    data: {
      product,
    },
  };
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      CurrentProductResponse.data.product.__typename = 'ConfigurableProduct';
      if (hasOperationName(req, ProductOperations.GetProductList)) {
        aliasQuery(req, ProductOperations.GetProductList);
        req.reply(ProductListResponse);
      }

      if (hasOperationName(req, ProductOperations.GetSingleProduct)) {
        aliasQuery(req, ProductOperations.GetSingleProduct);

        req.reply(CurrentProductResponse);
      }
      if (hasOperationName(req, ProductOperations.GetTranslatedProductTexts)) {
        aliasQuery(req, ProductOperations.GetTranslatedProductTexts);
        req.reply(TranslatedProductTextResponse);
      }
      if (hasOperationName(req, ProductOperations.GetProductAssignments)) {
        aliasQuery(req, ProductOperations.GetProductAssignments);
        req.reply(ProductAssignmentsResponse);
      }
      if (hasOperationName(req, ProductOperations.SearchProducts)) {
        aliasQuery(req, ProductOperations.SearchProducts);
        req.reply(SearchProductResponse);
      }
      if (hasOperationName(req, ProductOperations.AddProductAssignment)) {
        aliasMutation(req, ProductOperations.AddProductAssignment);
        req.reply(AddProductAssignmentResponse);
      }

      if (hasOperationName(req, ProductOperations.RemoveProductAssignment)) {
        aliasMutation(req, ProductOperations.RemoveProductAssignment);
        req.reply(RemoveProductAssignmentResponse);
      }
    });

    cy.visit('/');
    cy.viewport(1200, 800);
    cy.get('a[href="/products"]')
      .contains(localizations.en.products)
      .click({ force: true });

    cy.location('pathname').should('eq', '/products');
    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(ProductFilterRequest);
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );
    cy.get('h2').should('contain.text', localizations.en.products);

    cy.get(`a[href="/products?slug=${ACTIVE_PRODUCT_SLUG}"]`).first().click();
    cy.location('pathname').should('eq', `/products?slug=${ACTIVE_PRODUCT_SLUG}`);

    cy.wait(fullAliasName(ProductOperations.GetSingleProduct)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: parseUniqueId(ACTIVE_PRODUCT_SLUG),
        });
        expect(response.body).to.deep.eq(CurrentProductResponse);
      },
    );

    cy.wait(fullAliasName(ProductOperations.GetTranslatedProductTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(TranslatedProductTextResponse);
      },
    );

    cy.get('a#assignments')
      .should('contain.text', localizations.en.assignments)
      .click();

    cy.wait(fullAliasName(ProductOperations.GetProductAssignments)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductAssignmentsResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'assignments',
      });
    });
  });

  afterEach(() => {
    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'assignments',
      });
    });
  });

  context('Assignment', () => {
    it(`Should [DISPLAY ASSIGNMENT LIST] successfully   `, () => {
      cy.get('tr').should('have.length', 5);
    });
    it('Should add product variation assignment ', () => {
      const [firstProduct] = SearchProductResponse.data.searchProducts.products;
      cy.get('input#react-select-2-input').first().clear().type('Salad');

      cy.get('#react-select-2-option-3').click();
      cy.wait(
        fullAliasMutationName(ProductOperations.AddProductAssignment),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: firstProduct._id,
          proxyId: product._id,
          vectors: [
            {
              key: 'test-variation',
              value: 'first option value',
            },
          ],
        });

        expect(response.body).to.deep.eq(AddProductAssignmentResponse);
      });
    });

    it('Should [REMOVE productASSIGNMENT ] successfully', () => {
      cy.get(
        `button[type=button][aria-label="${localizations.en.delete}"]#delete_button`,
      ).click();
      cy.get('[aria-modal="true"]').should('not.to.be', undefined);
      cy.get('button[type="button"]#danger_continue')
        .should('contain.text', localizations.en.delete_variation_assignment)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.RemoveProductAssignment),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          proxyId: product._id,
          vectors: [
            {
              key: 'test-variation',
              value: 'second option value',
            },
          ],
        });
        expect(response.body).to.deep.eq(RemoveProductAssignmentResponse);
      });
    });
  });
});
