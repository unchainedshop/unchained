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
  const [firstLocale, secondLocale] = LanguagesResponse.data.languages;
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

    cy.get('a#variations')
      .should('contain.text', localizations.en.variations)
      .click();

    cy.get('select#locale-wrapper').select(firstLocale.isoCode);
    cy.wait(fullAliasName(ProductOperations.GetProductVariations)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductVariationsResponse);
      },
    );

    cy.wait(fullAliasName(ProductOperations.GetProductVariationType)).then(
      (currentSubject) => {
        const { response } = currentSubject;

        expect(response.body).to.deep.eq(ProductVariationTypesResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'variations',
      });
    });
  });

  afterEach(() => {
    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'variations',
      });
    });
  });

  context('Variation', () => {
    it(`Should [DISPLAY VARIATION LIST] successfully  ${firstVariationType.value} `, () => {
      cy.get(`form.variation-update-form`).should(
        'have.length',
        ProductVariationsResponse.data.product.variations.length,
      );
    });

    it(`Should [CREATE PRODUCT VARIATION] successfully  ${firstVariationType.value} `, () => {
      cy.get('input[name="title"]').clear().type('variation title');
      cy.get('input[name="key"]').clear().type('variation key');
      cy.get('select[name="type"]').select(firstVariationType.value);
      cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
        .should('have.value', localizations.en.save)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.CreateProductVariation),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          variation: {
            type: firstVariationType.value,
            title: 'variation title',
            key: 'variation key',
          },
          productId: product._id,
        });
        expect(response.body).to.deep.eq(CreateProductVariationResponse);
      });
    });

    it(`Should [CREATE PRODUCT VARIATION] successfully  ${secondVariationType.value} `, () => {
      cy.get('input[name="title"]').clear().type('variation title');
      cy.get('input[name="key"]').clear().type('variation key');
      cy.get('select[name="type"]').select(secondVariationType.value);
      cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
        .should('have.value', localizations.en.save)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.CreateProductVariation),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          variation: {
            type: secondVariationType.value,
            title: 'variation title',
            key: 'variation key',
          },
          productId: product._id,
        });
        expect(response.body).to.deep.eq(CreateProductVariationResponse);
      });
    });

    it('Should [ERROR] when required quantity is missing', () => {
      cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
        .should('have.value', localizations.en.save)
        .click();

      cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
        .should('have.value', localizations.en.save)
        .should('be.disabled');

      cy.get('label[for="title"]').should(
        'have.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.title,
        ),
      );
      cy.get('label[for="key"]').should(
        'have.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.key,
        ),
      );
      cy.get('label[for="type"]').should(
        'have.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.type,
        ),
      );
    });

    it('Should [DELETE PRODUCT VARIATION] successfully', () => {
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;
      cy.get('#delete_button').first().click();
      cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
      cy.get('#danger_continue')
        .should('contain.text', localizations.en.delete_product_variation)
        .click();
      cy.get('div[aria-modal="true"]').should('to.be', undefined);
      cy.wait(
        fullAliasMutationName(ProductOperations.RemoveProductVariation),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productVariationId: firstVariation._id,
        });
        expect(response.body).to.deep.eq(RemoveProductVariationResponse);
      });
    });

    it('Should [CANCEL DELETE VARIATION] successfully', () => {
      cy.get('#delete_button').first().click();
      cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
      cy.get('#danger_cancel')
        .should('contain.text', localizations.en.cancel)
        .click();
      cy.get('div[aria-modal="true"]').should('to.be', undefined);
    });

    it(`Should [INITIALIZE VARIATION TEXT FORM] successfully `, () => {
      cy.get('select#locale-wrapper').select(secondLocale.isoCode);
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;
      cy.get(
        `form[data-variationid="${firstVariation._id}"] #edit__icon_button`,
      ).click();

      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="title"]`,
      ).should('have.value', firstVariation.texts.title);

      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="subtitle"]`,
      ).should('have.value', firstVariation.texts.subtitle || '');
    });

    it(`Should [UPDATE PRODUCT VARIATION TEXT] successfully ${firstLocale.isoCode.toUpperCase()}  `, () => {
      cy.get('select#locale-wrapper').select(firstLocale.isoCode);
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;
      cy.get(
        `form[data-variationid="${firstVariation._id}"] #edit__icon_button`,
      ).click();

      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="title"]`,
      )
        .clear()
        .type('updated variation title');
      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="subtitle"]`,
      )
        .clear()
        .type('updated variation subtitle');

      cy.get(
        `form[data-variationid="${firstVariation._id}"] button[type="submit"]`,
      )
        .should('contain.text', localizations.en.save)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.UpdateProductVariationTexts),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productVariationId: firstVariation._id,
          texts: [
            {
              title: 'updated variation title',
              subtitle: 'updated variation subtitle',
              locale: firstLocale.isoCode,
            },
          ],
        });
        expect(response.body).to.deep.eq(UpdateProductVariationTextResponse);
      });
    });

    it(`Should [UPDATE PRODUCT VARIATION TEXT] successfully ${secondLocale.isoCode.toUpperCase()}  `, () => {
      cy.get('select#locale-wrapper').select(secondLocale.isoCode);
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;
      cy.get(
        `form[data-variationid="${firstVariation._id}"] #edit__icon_button`,
      ).click();

      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="title"]`,
      )
        .clear()
        .type('updated variation title');
      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="subtitle"]`,
      )
        .clear()
        .type('updated variation subtitle');

      cy.get(
        `form[data-variationid="${firstVariation._id}"] button[type="submit"]`,
      )
        .should('contain.text', localizations.en.save)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.UpdateProductVariationTexts),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productVariationId: firstVariation._id,
          texts: [
            {
              title: 'updated variation title',
              subtitle: 'updated variation subtitle',
              locale: secondLocale.isoCode,
            },
          ],
        });
        expect(response.body).to.deep.eq(UpdateProductVariationTextResponse);
      });
    });

    it(`Should [VARIATION TEXT FORM CANCEL] hide form successfully  `, () => {
      cy.get('select#locale-wrapper').select(firstLocale.isoCode);
      const [firstVariation] =
        ProductVariationsResponse.data.product.variations;
      cy.get(
        `form[data-variationid="${firstVariation._id}"] #edit__icon_button`,
      ).click();

      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="title"]`,
      )
        .clear()
        .type('updated variation title');
      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="subtitle"]`,
      )
        .clear()
        .type('updated variation subtitle');

      cy.get(
        `form[data-variationid="${firstVariation._id}"] button[type="button"]`,
      )
        .should('contain.text', localizations.en.cancel)
        .click();

      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="title"]`,
      ).should('to.be', undefined);

      cy.get(
        `form[data-variationid="${firstVariation._id}"] input[name="subtitle"]`,
      ).should('to.be', undefined);
    });
  });

  context('Variation Options', () => {
    const [firstVariation] = ProductVariationsResponse.data.product.variations;
    const [firstOption] = firstVariation.options;

    it('Should  [DISPLAY VARIATION OPTION] successfully', () => {
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click({ multiple: true });
      cy.get(
        `div[data-variationid="${firstVariation._id}"] .variation-option-update-form`,
      ).should('have.length', firstVariation.options.length);
    });

    it('Should  [ADD VARIATION OPTION] successfully', () => {
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();
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
        expect(request.body.variables).to.deep.eq({
          productVariationId: firstVariation._id,
          option: {
            value: 'new option value',
            title: 'new option',
          },
        });
        expect(response.body).to.deep.eq(CreateProductVariationOptionResponse);
      });
    });

    it('Should  [DISPLAY ERROR] when required fields are missing successfully', () => {
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();
      cy.get(`form.variation-option-form input[name="title"]`);
      cy.get(`form.variation-option-form input[name="value"]`);
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
      cy.get(`form.variation-option-form label[for="title"]`).should(
        'have.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.title,
        ),
      );
      cy.get(`form.variation-option-form label[for="value"]`).should(
        'have.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.value,
        ),
      );
    });

    it('Should  [INITIALIZE VARIATION OPTION FORM] successfully', () => {
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();

      cy.get(
        `form.variation-option-update-form div[data-optionvalue="${firstOption.value}"]`,
      ).click();
      cy.get(`form.variation-option-update-form input[name="title"] `).should(
        'have.value',
        firstOption.texts.title || '',
      );
      cy.get(
        `form.variation-option-update-form input[name="subtitle"] `,
      ).should('have.value', firstOption.texts.subtitle || '');
    });

    it(`Should  [UPDATE VARIATION OPTION] successfully [${secondLocale.isoCode.toUpperCase()}] `, () => {
      cy.get('select#locale-wrapper').select(secondLocale.isoCode);
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();
      cy.get(
        `form.variation-option-update-form div[data-optionvalue="${firstOption.value}"]`,
      ).click();
      cy.get(`form.variation-option-update-form input[name="title"] `)
        .clear()
        .type('updated variation option title');
      cy.get(`form.variation-option-update-form input[name="subtitle"] `)
        .clear()
        .type('updated variation option subtitle');

      cy.get(`form.variation-option-update-form button[type="submit"]`)
        .should('contain.text', localizations.en.save)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.UpdateProductVariationTexts),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productVariationId: firstVariation._id,
          productVariationOptionvalue: firstOption.value,
          texts: [
            {
              title: 'updated variation option title',
              subtitle: 'updated variation option subtitle',
              locale: secondLocale.isoCode,
            },
          ],
        });

        expect(response.body).to.deep.eq(UpdateProductVariationTextResponse);
      });
    });

    it(`Should  [UPDATE VARIATION OPTION] successfully [${firstLocale.isoCode.toUpperCase()}] `, () => {
      cy.get('select#locale-wrapper').select(firstLocale.isoCode);
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();
      cy.get(
        `form.variation-option-update-form div[data-optionvalue="${firstOption.value}"]`,
      ).click();
      cy.get(`form.variation-option-update-form input[name="title"] `)
        .clear()
        .type('updated variation option title');
      cy.get(`form.variation-option-update-form input[name="subtitle"] `)
        .clear()
        .type('updated variation option subtitle');

      cy.get(`form.variation-option-update-form button[type="submit"]`)
        .should('contain.text', localizations.en.save)
        .click();

      cy.wait(
        fullAliasMutationName(ProductOperations.UpdateProductVariationTexts),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productVariationId: firstVariation._id,
          productVariationOptionvalue: firstOption.value,
          texts: [
            {
              title: 'updated variation option title',
              subtitle: 'updated variation option subtitle',
              locale: firstLocale.isoCode,
            },
          ],
        });

        expect(response.body).to.deep.eq(UpdateProductVariationTextResponse);
      });
    });

    it(`Should  [CANCEL UPDATE VARIATION OPTION] successfully `, () => {
      cy.get('select#locale-wrapper').select(secondLocale.isoCode);
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();
      cy.get(
        `form.variation-option-update-form div[data-optionvalue="${firstOption.value}"]`,
      ).click();

      cy.get(`form.variation-option-update-form input[name="title"] `)
        .clear()
        .type('updated variation option title');
      cy.get(`form.variation-option-update-form input[name="subtitle"] `)
        .clear()
        .type('updated variation option subtitle');

      cy.get(`form.variation-option-update-form button[type="button"]`)
        .should('contain.text', localizations.en.cancel)
        .first()
        .click();
      cy.get(`form.variation-option-update-form input[name="title"] `).should(
        'to.be',
        undefined,
      );

      cy.get(
        `form.variation-option-update-form input[name="subtitle"] `,
      ).should('to.be', undefined);
    });

    it('Should  [REMOVE VARIATION OPTION] successfully', () => {
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();

      cy.get(`form.variation-option-update-form button#delete_button`)
        .first()
        .click();
      cy.get('div[aria-modal]').should('not.to.be', undefined);
      cy.get('button[type="button"]#danger_continue')
        .should('have.text', localizations.en.delete_variation_option)
        .click();
      cy.get('div[aria-modal]').should('to.be', undefined);
      cy.wait(
        fullAliasMutationName(ProductOperations.RemoveProductVariationOption),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productVariationId: firstVariation._id,
          productVariationOptionvalue: firstOption.value,
        });
        expect(response.body).to.deep.eq(RemoveProductVariationOptionResponse);
      });
    });

    it('Should  [CANCEL DELETING VARIATION OPTION] ', () => {
      cy.get(
        `div[data-variationid="${firstVariation._id}"] [data-itemindex="0"] button[type="button"] > span`,
      )
        .first()
        .click();

      cy.get(`form.variation-option-update-form button#delete_button`)
        .first()
        .click();
      cy.get('div[aria-modal]').should('not.to.be', undefined);
      cy.get('button[type="button"]#danger_cancel')
        .should('have.text', localizations.en.cancel)
        .click();
      cy.get('div[aria-modal]').should('to.be', undefined);
    });
  });
});
