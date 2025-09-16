import localizations from '../../src/i18n';
import { parseUniqueId } from '../../src/modules/common/utils/getUniqueId';
import {
  ACTIVE_PRODUCT_SLUG,
  CreateProductBundleItemResponse,
  ProductBundleItemsResponse,
  ProductFilterRequest,
  ProductListResponse,
  ProductOperations,
  RemoveBundleItemResponse,
  TranslatedProductTextResponse,
} from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Product Subscription', () => {
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
      CurrentProductResponse.data.product.__typename = 'BundleProduct';
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
      if (hasOperationName(req, ProductOperations.GetProductBundleItems)) {
        aliasQuery(req, ProductOperations.GetProductBundleItems);
        req.reply(ProductBundleItemsResponse);
      }
      if (hasOperationName(req, ProductOperations.CreateProductBundleItem)) {
        aliasMutation(req, ProductOperations.CreateProductBundleItem);
        req.reply(CreateProductBundleItemResponse);
      }

      if (hasOperationName(req, ProductOperations.RemoveBundleItem)) {
        aliasMutation(req, ProductOperations.RemoveBundleItem);
        req.reply(RemoveBundleItemResponse);
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

    cy.get('a#bundled_products')
      .should('contain.text', localizations.en.bundle)
      .click();

    cy.wait(fullAliasName(ProductOperations.GetProductBundleItems)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductBundleItemsResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'bundled_products',
      });
    });
  });

  afterEach(() => {
    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'bundled_products',
      });
    });
  });

  it('Should [ADD BUNDLE ITEM LINK] successfully ', () => {
    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
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
        });
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );

    cy.get('input#react-select-2-input').clear().type('t');

    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: 't',
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
        });
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );
    cy.get('#react-select-2-option-1').click();

    cy.get('input[name="quantity"]').clear().type('3');
    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.submit)
      .click();

    cy.wait(
      fullAliasMutationName(ProductOperations.CreateProductBundleItem),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        item: {
          productId: ProductListResponse.data.products[1]._id,
          quantity: 3,
        },
        productId: product._id,
      });
      expect(response.body).to.deep.eq(CreateProductBundleItemResponse);
    });
  });

  it('Should [ERROR] when required quantity is missing', () => {
    cy.get('input[name="quantity"]').clear();
    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.submit)
      .click();

    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.submit)
      .should('be.disabled');

    cy.get('label[for="quantity"]').should(
      'have.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.quantity,
      ),
    );
  });
  it('Should [ERROR] when required product is missing', () => {
    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.submit)
      .click();

    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.submit)
      .should('be.disabled');

    cy.get('label[for="productId"]').should(
      'have.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.product,
      ),
    );
  });

  it('Should [DELETE BUNDLE PRODUCT] successfully', () => {
    cy.get('#delete_button').first().click();
    cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
    cy.get('#danger_continue')
      .should('contain.text', localizations.en.delete_bundle_item)
      .click();
    cy.get('div[aria-modal="true"]').should('to.be', undefined);
    cy.wait(fullAliasMutationName(ProductOperations.RemoveBundleItem)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
          index: 0,
        });
        expect(response.body).to.deep.eq(RemoveBundleItemResponse);
      },
    );
  });

  it('Should [CANCEL DELETE BUNDLE] successfully', () => {
    cy.get('#delete_button').first().click();
    cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
    cy.get('#danger_cancel')
      .should('contain.text', localizations.en.cancel)
      .click();
    cy.get('div[aria-modal="true"]').should('to.be', undefined);
  });
});
