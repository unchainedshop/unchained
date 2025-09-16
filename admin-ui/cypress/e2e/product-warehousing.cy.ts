import localizations from '../../src/i18n';
import { parseUniqueId } from '../../src/modules/common/utils/getUniqueId';
import {
  ACTIVE_PRODUCT_SLUG,
  ProductFilterRequest,
  ProductListResponse,
  ProductOperations,
  ProductWarehousingResponse,
  TranslatedProductTextResponse,
  UpdateProductWarehousingResponse,
} from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';

describe('Product Warehousing', () => {
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
      if (hasOperationName(req, ProductOperations.GetProductWarehousing)) {
        aliasQuery(req, ProductOperations.GetProductWarehousing);
        req.reply(ProductWarehousingResponse);
      }
      if (hasOperationName(req, ProductOperations.UpdateProductWarehousing)) {
        aliasMutation(req, ProductOperations.UpdateProductWarehousing);
        req.reply(UpdateProductWarehousingResponse);
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

    cy.get('a#warehousing')
      .should('contain.text', localizations.en.warehousing)
      .click();

    cy.wait(fullAliasName(ProductOperations.GetProductWarehousing)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductWarehousingResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'warehousing',
      });
    });
  });

  afterEach(() => {
    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'warehousing',
      });
    });
  });

  it('Should [UPDATE WAREHOUSING] successfully ', () => {
    cy.get('input[name="sku"]').clear().type('updated sku');
    cy.get('input[name="baseUnit"]').clear().type('M');

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .click();

    cy.wait(
      fullAliasMutationName(ProductOperations.UpdateProductWarehousing),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        productId: product._id,
        warehousing: {
          baseUnit: 'M',
          sku: 'updated sku',
        },
      });
      expect(response.body).to.deep.eq(UpdateProductWarehousingResponse);
    });
  });

  it('Should [INITIALIZE FORM] successfully', () => {
    const { ...warehousing } = ProductWarehousingResponse.data.product;
    cy.get('input[name="sku"]').should('have.value', warehousing.sku);
    cy.get('input[name="baseUnit"]').should('have.value', warehousing.baseUnit);

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .should('not.be.disabled');
  });
});
