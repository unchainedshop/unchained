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
  });

  it('Should [INITIALIZE PRODUCT TEXT FORM] successfully', () => {
    cy.get('input[name="title"]').should('not.have.value', '');
    cy.get('input[name="subtitle"]').should('not.have.value', '');
    cy.get('input[name="brand"]').should('not.have.value', '');
    cy.get('input[name="vendor"]').should('not.have.value', '');
  });

  it('Should [RE-INITIALIZE PRODUCT TEXT FORM] when locale is changed successfully', () => {
    cy.get('select[id="locale-wrapper"]').then(($select) => {
      const options = $select.find('option');
      if (options.length > 1) {
        const secondOption = options.eq(1).val() as string;
        cy.get('select[id="locale-wrapper"]').select(secondOption);
        cy.get('input[name="title"]').should('not.have.value', '');
      }
    });
  });

  it('Should [UPDATE PRODUCT TEXT FORM] successfully', () => {
    cy.get('input[name="title"]').clear().type('updated title');
    cy.get('input[name="slug"]').clear().type('updated slug');
    cy.get('input[name="subtitle"]').clear().type('updated subtitle');
    cy.get('input[name="brand"]').clear().type('updated brand');
    cy.get('input[name="vendor"]').clear().type('updated vendor');
    cy.get('input#labels').first().type('updated label{enter}', { force: true });

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .click();
    cy.wait(fullAliasMutationName(ProductOperations.UpdateTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables.productId).to.eq(product._id);
        expect(request.body.variables.texts[0].title).to.eq('updated title');
        expect(request.body.variables.texts[0].slug).to.eq('updated slug');
        expect(request.body.variables.texts[0].subtitle).to.eq('updated subtitle');
        expect(request.body.variables.texts[0].brand).to.eq('updated brand');
        expect(request.body.variables.texts[0].vendor).to.eq('updated vendor');
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
    cy.get('form#add_tag_form .react-select__input-container input')
      .type('new{enter}', { force: true });
    cy.get('form#add_tag_form').within(() => {
      cy.get('input[type="submit"]').contains(localizations.en.save).click();
    });

    cy.wait(fullAliasMutationName(ProductOperations.UpdateProduct)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables.productId).to.eq(product._id);
        expect(currentSubject.response.body).to.deep.eq(UpdateProductResponse);
      },
    );
  });

  it('Should cancel [ADD TAGS] form successfully', () => {
    cy.get('button#add_tag').click();
    cy.get('[data-id="cancel_update"]')
      .contains(localizations.en.cancel)
      .click({ force: true });
    cy.url().should('include', `/products/?slug=${generateUniqueId(product)}`,
    );
  });

  it('Show [ERROR] when required fields are missing', () => {
    cy.get('input[name="title"]').clear();
    cy.get('input[name="slug"]').clear();
    cy.get('input[name="subtitle"]').clear();
    cy.get('input[name="brand"]').clear();
    cy.get('input[name="vendor"]').clear();
    cy.get('input#labels').first().clear({ force: true });
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
