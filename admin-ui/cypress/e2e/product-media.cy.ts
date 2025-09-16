import localizations from '../../src/i18n';
import generateUniqueId, {
  parseUniqueId,
} from '../../src/modules/common/utils/getUniqueId';

import {
  ACTIVE_PRODUCT_SLUG,
  ProductFilterRequest,
  ProductListResponse,
  ProductMediaResponse,
  ProductOperations,
  RemoveProductMediaResponse,
  TranslatedProductMediaTextsResponse,
  TranslatedProductTextResponse,
  UpdateProductMediaTextsResponse,
} from '../mock/product';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';

describe('Product Media', () => {
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
      if (hasOperationName(req, ProductOperations.ProductMedia)) {
        aliasQuery(req, ProductOperations.ProductMedia);
        req.reply(ProductMediaResponse);
      }
      if (hasOperationName(req, ProductOperations.GetMediaTexts)) {
        aliasQuery(req, ProductOperations.GetMediaTexts);
        req.reply(TranslatedProductMediaTextsResponse);
      }
      if (hasOperationName(req, ProductOperations.RemoveMedia)) {
        aliasMutation(req, ProductOperations.RemoveMedia);
        req.reply(RemoveProductMediaResponse);
      }
      if (hasOperationName(req, ProductOperations.UpdateProductMediaTexts)) {
        aliasMutation(req, ProductOperations.UpdateProductMediaTexts);
        req.reply(UpdateProductMediaTextsResponse);
      }
    });

    cy.viewport(1200, 800);
    cy.visit('/');
    cy.get('a[href="/products"]')
      .contains(localizations.en.products)
      .click({ force: true });

    cy.wait(fullAliasName(ProductOperations.GetProductList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(ProductFilterRequest);
        expect(response.body).to.deep.eq(ProductListResponse);
      },
    );

    cy.location('pathname').should('eq', '/products');
    cy.get('h2').should('contain.text', localizations.en.products);

    cy.get(`a[href="/products?slug=${generateUniqueId(product)}"]`)
      .contains(product?.texts?.title)
      .click();

    cy.wait(fullAliasName(ProductOperations.GetSingleProduct)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(CurrentProductResponse);
      },
    );

    cy.wait(fullAliasName(ProductOperations.GetTranslatedProductTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: CurrentProductResponse.data.product._id,
        });
        expect(response.body).to.deep.eq(TranslatedProductTextResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/products?slug=${generateUniqueId(product)}`,
    );

    cy.get('a#media').contains(localizations.en.media).click();
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(`/products?slug=${generateUniqueId(product)}`);
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'media',
      });
    });

    cy.wait(fullAliasName(ProductOperations.GetMediaTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productMediaId: ProductMediaResponse.data.product.media[0]._id,
        });
        expect(response.body).to.deep.eq(TranslatedProductMediaTextsResponse);
      },
    );

    cy.wait(fullAliasName(ProductOperations.ProductMedia)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductMediaResponse);
      },
    );

    cy.get('select#locale-wrapper').select('en');
  });

  it('Should Navigate to [PRODUCT DETAIL MEDIA] tab successfully', () => {
    cy.get('div#media_uploader').should('be.visible');
  });

  it('Should [DELETE] media successfully', () => {
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_product_media)
      .click();

    cy.wait(fullAliasMutationName(ProductOperations.RemoveMedia)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productMediaId: ProductMediaResponse.data.product.media[0]._id,
        });
        expect(response.body).to.deep.eq(RemoveProductMediaResponse);
      },
    );

    cy.wait(fullAliasName(ProductOperations.ProductMedia)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductMediaResponse);
      },
    );

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(`/products?slug=${generateUniqueId(product)}`);
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'media',
      });
    });
  });

  it('Should [CANCEL] delete media successfully', () => {
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_cancel')
      .contains(localizations.en.cancel)
      .click();

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(`/products?slug=${generateUniqueId(product)}`);
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'media',
      });
    });
  });

  it('Should [UPDATE] media texts successfully', () => {
    const { translatedProductMediaTexts: mediaTexts } =
      TranslatedProductMediaTextsResponse.data;

    cy.get('div#edit__icon_button').first().click();
    cy.get('input#title').clear().type(mediaTexts[0].title);
    cy.get('input#subtitle').clear().type(mediaTexts[0].subtitle);

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .click();

    cy.wait(
      fullAliasMutationName(ProductOperations.UpdateProductMediaTexts),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        productMediaId: ProductMediaResponse.data.product.media[0]._id,
        texts: [
          {
            locale: 'en',
            title: mediaTexts[0].title,
            subtitle: mediaTexts[0].title,
          },
        ],
      });
      expect(response.body).to.deep.eq(UpdateProductMediaTextsResponse);
    });

    cy.wait(fullAliasName(ProductOperations.GetMediaTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productMediaId: ProductMediaResponse.data.product.media[0]._id,
        });
        expect(response.body).to.deep.eq(TranslatedProductMediaTextsResponse);
      },
    );

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(`/products?slug=${generateUniqueId(product)}`);
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'media',
      });
    });
  });

  it('Should [CANCEL] in media texts update form', () => {
    cy.get('div#edit__icon_button').first().click();
    cy.get('input#title').clear().type('title');
    cy.get('button[type="button"][data-id="cancel_update"]')
      .contains(localizations.en.cancel)
      .click();

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(`/products?slug=${generateUniqueId(product)}`);
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'media',
      });
    });
  });
});
