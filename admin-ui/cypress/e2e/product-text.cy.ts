import localizations from '../../src/i18n';
import generateUniqueId, {
  parseUniqueId,
} from '../../src/modules/common/utils/getUniqueId';
import { LanguageOperations, LanguagesResponse } from '../mock/language';
import {
  ACTIVE_PRODUCT_SLUG,
  ProductFilterRequest,
  ProductListResponse,
  ProductOperations,
  TranslatedProductTextResponse,
  UpdateProductResponse,
  UpdateProductTextsResponse,
} from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Product Text', () => {
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
      if (hasOperationName(req, LanguageOperations.GetLanguagesList)) {
        req.reply(LanguagesResponse);
      }
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
      if (hasOperationName(req, ProductOperations.UpdateTexts)) {
        aliasMutation(req, ProductOperations.UpdateTexts);
        req.reply(UpdateProductTextsResponse);
      }
      if (hasOperationName(req, ProductOperations.UpdateProduct)) {
        aliasMutation(req, ProductOperations.UpdateProduct);
        req.reply(UpdateProductResponse);
      }
    });
    cy.visit('/');
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
  });

  it('Should [INITIALIZE PRODUCT TEXT FORM] successfully', () => {
    const [, de] = TranslatedProductTextResponse.data.translatedProductTexts;
    cy.get('input[name="title"]').should('have.value', de.title);
    cy.get('input[name="subtitle"]').should('have.value', de.subtitle);
    cy.get('input[name="brand"]').should('have.value', de.brand);
    cy.get('input[name="vendor"]').should('have.value', de.vendor);
    cy.get('span[id="badge"]').should('contain.text', de.labels);
    /* cy.get('input[name="description"]').should('have.value', de.description); */
  });

  it('Should [RE-INITIALIZE PRODUCT TEXT FORM] when locale is changed successfully', () => {
    const [deLocale, enLocale] = LanguagesResponse.data.languages;
    const [en, de] = TranslatedProductTextResponse.data.translatedProductTexts;
    cy.get('select[id="locale-wrapper"]').select(deLocale.isoCode);
    cy.get('input[name="title"]').should('have.value', de.title);
    cy.get('input[name="subtitle"]').should('have.value', de.subtitle);
    cy.get('input[name="brand"]').should('have.value', de.brand);
    cy.get('input[name="vendor"]').should('have.value', de.vendor);
    cy.get('span[id="badge"]').should('contain.text', de.labels);
    /* cy.get('input[name="description"]').should('contain.text', de.description); */

    cy.get('select[id="locale-wrapper"]').select(enLocale.isoCode);

    cy.get('input[name="title"]').should('have.value', en.title);
    cy.get('input[name="subtitle"]').should('have.value', en.subtitle);
    cy.get('input[name="brand"]').should('have.value', en.brand);
    cy.get('input[name="vendor"]').should('have.value', en.vendor);
    cy.get('span[id="badge"]').should('contain.text', en.labels);
    /* cy.get('input[name="description"]').should('contain.text', en.description); */
  });

  it('Should [UPDATE PRODUCT TEXT FORM] successfully', () => {
    const [deLocale] = LanguagesResponse.data.languages;

    cy.get('input[name="title"]').clear().type('updated title');
    cy.get('input[name="slug"]').clear().type('updated slug');
    cy.get('input[name="subtitle"]').clear().type('updated subtitle');
    cy.get('input[name="brand"]').clear().type('updated brand');
    cy.get('input[name="vendor"]').clear().type('updated vendor');
    cy.get('input[name="labels"]')
      .clear()
      .type('updated label')
      .type('{enter}');

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .click();
    cy.wait(fullAliasMutationName(ProductOperations.UpdateTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect({
          ...request.body.variables,
          texts: [{ ...request.body.variables.texts[0], description: null }],
        }).to.deep.eq({
          productId: product._id,
          texts: [
            {
              title: 'updated title',
              slug: 'updated slug',
              subtitle: 'updated subtitle',
              brand: 'updated brand',
              vendor: 'updated vendor',
              labels: ['test label en', 'updated label'],
              locale: deLocale.isoCode,
              description: null,
            },
          ],
        });
        expect(response.body).to.deep.eq(UpdateProductTextsResponse);
      },
    );
  });

  it('Should be visible [ADD TAGS] form successfully', () => {
    cy.get('button#add_tag').click();
    cy.get('form#add_tag_form').should('be.visible');
  });

  it('Should [ADD TAGS] successfully', () => {
    cy.get('button#add_tag').click();
    cy.get('input#tags').type('new');
    cy.get('button#add-tag').contains(localizations.en.add_tag).click();
    cy.get('form#add_tag_form').within(() => {
      cy.get('input[type="submit"]').contains(localizations.en.save).click();
    });

    cy.wait(fullAliasMutationName(ProductOperations.UpdateProduct)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          product: { tags: ['new'] },
          productId: product._id,
        });
        expect(currentSubject.response.body).to.deep.eq(UpdateProductResponse);
      },
    );
  });

  it('Should cancel [ADD TAGS] form successfully', () => {
    cy.get('button#add_tag').click();
    cy.get('[data-id="cancel_update"]')
      .contains(localizations.en.cancel)
      .click({ force: true });
    cy.location('pathname').should(
      'eq',
      `/products?slug=${generateUniqueId(product)}`,
    );
  });

  it('Show [ERROR] when required fields are missing', () => {
    cy.get('input[name="title"]').clear();
    cy.get('input[name="slug"]').clear();
    cy.get('input[name="subtitle"]').clear();
    cy.get('input[name="brand"]').clear();
    cy.get('input[name="vendor"]').clear();
    cy.get('input[name="labels"]').clear();
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.save}"]`,
    ).should('be.disabled');

    cy.get('label[for="title"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.title,
      ),
    );
    cy.get('label[for="slug"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.slug,
      ),
    );
  });
});
