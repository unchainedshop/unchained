import localizations from '../../src/i18n';
import { parseUniqueId } from '../../src/modules/common/utils/getUniqueId';
import {
  ACTIVE_PRODUCT_SLUG,
  ProductFilterRequest,
  ProductListResponse,
  ProductOperations,
  ProductSupplyResponse,
  TranslatedProductTextResponse,
  UpdateProductSupplyResponse,
} from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Product Supply', () => {
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
      if (hasOperationName(req, ProductOperations.GetProductSupply)) {
        aliasQuery(req, ProductOperations.GetProductSupply);
        req.reply(ProductSupplyResponse);
      }
      if (hasOperationName(req, ProductOperations.UpdateProductSupply)) {
        aliasMutation(req, ProductOperations.UpdateProductSupply);
        req.reply(UpdateProductSupplyResponse);
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

    cy.get('a#supply').should('contain.text', localizations.en.supply).click();

    cy.wait(fullAliasName(ProductOperations.GetProductSupply)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductSupplyResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'supply',
      });
    });
  });

  afterEach(() => {
    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'supply',
      });
    });
  });

  it('Should [UPDATE SUPPLY] successfully ', () => {
    cy.get('input[name="width"][type="number"]').clear().type('12');
    cy.get('input[name="height"][type="number"]').clear().type('12');
    cy.get('input[name="weight"][type="number"]').clear().type('12');
    cy.get('input[name="length"][type="number"]').clear().type('12');
    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .click();

    cy.wait(fullAliasMutationName(ProductOperations.UpdateProductSupply)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
          supply: {
            weightInGram: 12,
            heightInMillimeters: 12,
            lengthInMillimeters: 12,
            widthInMillimeters: 12,
          },
        });
        expect(response.body).to.deep.eq(UpdateProductSupplyResponse);
      },
    );
  });

  it('Should [INITIALIZE FORM] successfully', () => {
    const { dimensions } = ProductSupplyResponse.data.product;
    cy.get('input[name="width"][type="number"]').should(
      'have.value',
      dimensions.width,
    );
    cy.get('input[name="height"][type="number"]').should(
      'have.value',
      dimensions.height,
    );
    cy.get('input[name="weight"][type="number"]').should(
      'have.value',
      dimensions.weight,
    );
    cy.get('input[name="length"][type="number"]').should(
      'have.value',
      dimensions.length,
    );
    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .should('not.be.disabled');
  });

  it('Should [ERROR] when  valid integer value is not provided', () => {
    cy.get('input[name="width"][type="number"]').clear();
    cy.get('input[name="height"][type="number"]').clear();
    cy.get('input[name="weight"][type="number"]').clear();
    cy.get('input[name="length"][type="number"]').clear().blur();
    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .should('be.disabled');

    cy.get('label[for="width"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_number_not_int,
        localizations.en.width,
      ),
    );
    cy.get('label[for="height"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_number_not_int,
        localizations.en.height,
      ),
    );
    cy.get('label[for="weight"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_number_not_int,
        localizations.en.weight_gram,
      ),
    );
    cy.get('label[for="length"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_number_not_int,
        localizations.en.length_millimeter,
      ),
    );
  });
});
