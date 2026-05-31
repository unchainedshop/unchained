import localizations from '../../src/i18n';
import { parseUniqueId } from '../../src/modules/common/utils/getUniqueId';
import { LanguagesResponse } from '../mock/language';
import {
  ACTIVE_PRODUCT_SLUG,
  CreateProductVariationOptionResponse,
  CreateProductVariationResponse,
  ProductFilterRequest,
  ProductListResponse,
  ProductOperations,
  ProductVariationsResponse,
  ProductVariationTypesResponse,
  RemoveProductVariationOptionResponse,
  RemoveProductVariationResponse,
  TranslatedProductTextResponse,
  UpdateProductVariationTextResponse,
} from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Product Variation', () => {
  const [firstVariationType, secondVariationType] =
    ProductVariationTypesResponse.data.variationTypes.options;
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
      if (hasOperationName(req, ProductOperations.GetProductVariations)) {
        aliasQuery(req, ProductOperations.GetProductVariations);
        req.reply(ProductVariationsResponse);
      }
      if (hasOperationName(req, ProductOperations.GetProductVariationType)) {
        aliasQuery(req, ProductOperations.GetProductVariationType);
        req.reply(ProductVariationTypesResponse);
      }
      if (hasOperationName(req, ProductOperations.CreateProductVariation)) {
        aliasMutation(req, ProductOperations.CreateProductVariation);
        req.reply(CreateProductVariationResponse);
      }

      if (hasOperationName(req, ProductOperations.RemoveProductVariation)) {
        aliasMutation(req, ProductOperations.RemoveProductVariation);
        req.reply(RemoveProductVariationResponse);
      }

      if (
        hasOperationName(req, ProductOperations.UpdateProductVariationTexts)
      ) {
        aliasMutation(req, ProductOperations.UpdateProductVariationTexts);
        req.reply(UpdateProductVariationTextResponse);
      }

      if (
        hasOperationName(req, ProductOperations.CreateProductVariationOption)
      ) {
        aliasMutation(req, ProductOperations.CreateProductVariationOption);
        req.reply(CreateProductVariationOptionResponse);
      }

      if (
        hasOperationName(req, ProductOperations.RemoveProductVariationOption)
      ) {
        aliasMutation(req, ProductOperations.RemoveProductVariationOption);
        req.reply(RemoveProductVariationOptionResponse);
      }
    });

    cy.visit('/');
    cy.viewport(1200, 800);
    cy.get('a[href="/products/"]')
      .contains(localizations.en.products)
      .click({ force: true });

    cy.location('pathname').should('eq', '/products/');
    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include(ProductFilterRequest);
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );
    cy.get('h2').should('be.visible');

    cy.get(`a[href="/products/?slug=${ACTIVE_PRODUCT_SLUG}"]`).first().click();
    cy.url().should('include', `/products/?slug=${ACTIVE_PRODUCT_SLUG}`);

    cy.wait(fullAliasName(ProductOperations.GetSingleProduct)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          productId: parseUniqueId(ACTIVE_PRODUCT_SLUG),
        });
        expect(response.body).to.deep.eq(CurrentProductResponse);
      },
    );

    cy.wait(fullAliasName(ProductOperations.GetTranslatedProductTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(TranslatedProductTextResponse);
      },
    );

    cy.get('a#variations')
      .should('contain.text', localizations.en.variations)
      .click();

    cy.wait(fullAliasName(ProductOperations.GetProductVariations)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductVariationsResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq('/products/');
      expect(current.search).to.include('slug=');
      expect(convertURLSearchParamToObj(current.search)).to.have.property('tab', 'variations');
    });
  });

  afterEach(() => {
    cy.location().then((current) => {
      expect(current.pathname).to.eq('/products/');
      expect(current.search).to.include('slug=');
      expect(convertURLSearchParamToObj(current.search)).to.have.property('tab', 'variations');
    });
  });

  context('Variation', () => {
    it(`Should [DISPLAY VARIATION LIST] successfully  ${firstVariationType.value} `, () => {
      cy.get(`.variation-display`).should(
        'have.length',
        ProductVariationsResponse.data.product.variations.length,
      );
    });

    it(`Should [CREATE PRODUCT VARIATION] successfully  ${firstVariationType.value} `, () => {
      cy.contains('button', localizations.en.add_variation).click();
      cy.get('[aria-modal="true"] input[name="title"]').clear().type('variation title');
      cy.get('[aria-modal="true"] input[name="key"]').clear().type('variation key');
      cy.get('[aria-modal="true"] select[name="type"]').select(firstVariationType.value);
      cy.get('[aria-modal="true"] input[type="submit"]').click();

      cy.wait(
        fullAliasMutationName(ProductOperations.CreateProductVariation),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables.variation.type).to.eq(firstVariationType.value);
        expect(request.body.variables.variation.key).to.eq('variation key');
        expect(request.body.variables.productId).to.eq(product._id);
        expect(response.body).to.deep.eq(CreateProductVariationResponse);
      });
    });

    it(`Should [CREATE PRODUCT VARIATION] successfully  ${secondVariationType.value} `, () => {
      cy.contains('button', localizations.en.add_variation).click();
      cy.get('[aria-modal="true"] input[name="title"]').clear().type('variation title');
      cy.get('[aria-modal="true"] input[name="key"]').clear().type('variation key');
      cy.get('[aria-modal="true"] select[name="type"]').select(secondVariationType.value);
      cy.get('[aria-modal="true"] input[type="submit"]').click();

      cy.wait(
        fullAliasMutationName(ProductOperations.CreateProductVariation),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables.variation.type).to.eq(secondVariationType.value);
        expect(request.body.variables.variation.key).to.eq('variation key');
        expect(request.body.variables.productId).to.eq(product._id);
        expect(response.body).to.deep.eq(CreateProductVariationResponse);
      });
    });

    it('Should [ERROR] when required fields are missing', () => {
      cy.contains('button', localizations.en.add_variation).click();
      cy.get('[aria-modal="true"] input[type="submit"]').click();
      cy.get('[aria-modal="true"] input[type="submit"]').should('be.disabled');
      cy.get('[aria-modal="true"] label[for="title"]').should(
        'have.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.title,
        ),
      );
    });

    it('Should [DELETE PRODUCT VARIATION] successfully', () => {
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;
      cy.get('.variation-display').first().within(() => {
        cy.get('button').last().click({ force: true });
      });
      cy.get('.fixed.w-48 button').contains(localizations.en.delete).click();
      cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
      cy.get('#danger_continue')
        .should('contain.text', localizations.en.delete_product_variation)
        .click();
      cy.get('div[aria-modal="true"]').should('to.be', undefined);
      cy.wait(
        fullAliasMutationName(ProductOperations.RemoveProductVariation),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          productVariationId: firstVariation._id,
        });
        expect(response.body).to.deep.eq(RemoveProductVariationResponse);
      });
    });

    it('Should [CANCEL DELETE VARIATION] successfully', () => {
      cy.get('.variation-display').first().within(() => {
        cy.get('button').last().click({ force: true });
      });
      cy.get('.fixed.w-48 button').contains(localizations.en.delete).click();
      cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
      cy.get('#danger_cancel')
        .should('contain.text', localizations.en.cancel)
        .click();
      cy.get('div[aria-modal="true"]').should('to.be', undefined);
    });

    it(`Should [INITIALIZE VARIATION TEXT FORM] successfully `, () => {
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;

      cy.get('.variation-display').first().within(() => {
        cy.get('button').last().click({ force: true });
      });
      cy.get('.fixed.w-48 button').contains(localizations.en.edit).click();

      cy.get('form.variation-update-form input[name="title"]')
        .should('have.value', firstVariation.texts.title);

      cy.get('form.variation-update-form input[name="subtitle"]')
        .should('have.value', firstVariation.texts.subtitle || '');
    });

    it(`Should [UPDATE PRODUCT VARIATION TEXT] successfully  `, () => {
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;

      cy.get('.variation-display').first().within(() => {
        cy.get('button').last().click({ force: true });
      });
      cy.get('.fixed.w-48 button').contains(localizations.en.edit).click();

      cy.get('form.variation-update-form input[name="title"]')
        .clear()
        .type('updated variation title');
      cy.get('form.variation-update-form input[name="subtitle"]')
        .clear()
        .type('updated variation subtitle');

      cy.get('form.variation-update-form button[type="submit"]')
        .should('contain.text', localizations.en.save)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.UpdateProductVariationTexts),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables.productVariationId).to.eq(firstVariation._id);
        expect(request.body.variables.texts[0].title).to.eq('updated variation title');
        expect(request.body.variables.texts[0].subtitle).to.eq('updated variation subtitle');
        expect(response.body).to.deep.eq(UpdateProductVariationTextResponse);
      });
    });

    it(`Should [VARIATION TEXT FORM CANCEL] hide form successfully  `, () => {
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;

      cy.get('.variation-display').first().within(() => {
        cy.get('button').last().click({ force: true });
      });
      cy.get('.fixed.w-48 button').contains(localizations.en.edit).click();

      cy.get('form.variation-update-form input[name="title"]')
        .clear()
        .type('updated variation title');

      cy.get('form.variation-update-form button[type="button"]')
        .should('contain.text', localizations.en.cancel)
        .click();

      cy.get('form.variation-update-form input[name="title"]').should('to.be', undefined);
    });
  });

  context('Variation Options', () => {
    const [firstVariation] = ProductVariationsResponse.data.product.variations;

    it('Should  [DISPLAY VARIATION OPTION] successfully', () => {
      cy.get('.variation-display').should(
        'have.length',
        ProductVariationsResponse.data.product.variations.length,
      );
    });

    it('Should  [ADD VARIATION OPTION] successfully', () => {
      cy.get('.variation-display').first().click();
      cy.get(`form.variation-option-form input[name="title"]`)
        .clear()
        .type('new option');
      cy.get(`form.variation-option-form input[name="value"]`)
        .clear()
        .type('new option value');
      cy.get(
        `form.variation-option-form input[type="submit"][aria-label="${localizations.en.add_option}"]`,
      )
        .should('have.value', localizations.en.add_option)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.CreateProductVariationOption),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables.productVariationId).to.eq(firstVariation._id);
        expect(response.body).to.deep.eq(CreateProductVariationOptionResponse);
      });
    });

    it('Should  [DISPLAY ERROR] when required fields are missing successfully', () => {
      cy.get('.variation-display').first().click();
      cy.get(
        `form.variation-option-form input[type="submit"][aria-label="${localizations.en.add_option}"]`,
      )
        .should('have.value', localizations.en.add_option)
        .click();
      cy.get(
        `form.variation-option-form input[type="submit"][aria-label="${localizations.en.add_option}"]`,
      )
        .should('have.value', localizations.en.add_option)
        .should('be.disabled');
    });
  });
});
