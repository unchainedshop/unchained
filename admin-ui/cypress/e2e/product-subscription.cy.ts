import localizations from '../../src/i18n';
import { parseUniqueId } from '../../src/modules/common/utils/getUniqueId';
import {
  ACTIVE_PRODUCT_SLUG,
  ProductFilterRequest,
  ProductListResponse,
  ProductOperations,
  ProductPlanConfigurationOptionsResponse,
  ProductPlanResponse,
  TranslatedProductTextResponse,
  UpdateProductPlanResponse,
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
      if (hasOperationName(req, ProductOperations.GetProductList)) {
        aliasQuery(req, ProductOperations.GetProductList);
        req.reply(ProductListResponse);
      }
      if (
        hasOperationName(
          req,
          ProductOperations.GetProductPlanConfigurationOption,
        )
      ) {
        aliasQuery(req, ProductOperations.GetProductPlanConfigurationOption);
        req.reply(ProductPlanConfigurationOptionsResponse);
      }
      if (hasOperationName(req, ProductOperations.GetSingleProduct)) {
        aliasQuery(req, ProductOperations.GetSingleProduct);
        CurrentProductResponse.data.product.__typename = 'PlanProduct';
        req.reply(CurrentProductResponse);
      }
      if (hasOperationName(req, ProductOperations.GetTranslatedProductTexts)) {
        aliasQuery(req, ProductOperations.GetTranslatedProductTexts);
        req.reply(TranslatedProductTextResponse);
      }
      if (hasOperationName(req, ProductOperations.GetProductPlan)) {
        aliasQuery(req, ProductOperations.GetProductPlan);
        req.reply(ProductPlanResponse);
      }
      if (hasOperationName(req, ProductOperations.UpdateProductPlan)) {
        aliasMutation(req, ProductOperations.UpdateProductPlan);
        req.reply(UpdateProductPlanResponse);
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

    cy.get('a#subscriptions')
      .should('contain.text', localizations.en.subscription)
      .click();

    cy.wait(fullAliasName(ProductOperations.GetProductPlan)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
        });
        expect(response.body).to.deep.eq(ProductPlanResponse);
      },
    );

    cy.wait(
      fullAliasName(ProductOperations.GetProductPlanConfigurationOption),
    ).then((currentSubject) => {
      const { response } = currentSubject;

      expect(response.body).to.deep.eq(ProductPlanConfigurationOptionsResponse);
    });

    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'subscriptions',
      });
    });
  });

  afterEach(() => {
    cy.location().then((current) => {
      expect(current.pathname).to.eq(`/products?slug=${ACTIVE_PRODUCT_SLUG}`);
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        tab: 'subscriptions',
      });
    });
  });

  it('Should [UPDATE SUBSCRIPTION] successfully ', () => {
    const [calculation1] =
      ProductPlanConfigurationOptionsResponse.data.usageCalculationTypes
        .options;

    const [interval1, interval2] =
      ProductPlanConfigurationOptionsResponse.data.configurationIntervals
        .options;
    cy.get('select[name="usageCalculationType"]').select(calculation1.value);
    cy.get(
      `input[name="billingIntervalCount"][type="number"][placeholder="${localizations.en.billing_unit}"]`,
    )
      .clear()
      .type('3');
    cy.get(
      `input[name="trialIntervalCount"][type="number"][placeholder="${localizations.en.trial_unit}"]`,
    )
      .clear()
      .type('6');
    cy.get('select[name="billingInterval"]').select(interval1.value);
    cy.get('select[name="trialInterval"]').select(interval2.value);

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .click();

    cy.wait(fullAliasMutationName(ProductOperations.UpdateProductPlan)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          productId: product._id,
          plan: {
            billingIntervalCount: 3,
            trialIntervalCount: 6,
            usageCalculationType: calculation1.value,
            billingInterval: interval1.value,
            trialInterval: interval2.value,
          },
        });
        expect(response.body).to.deep.eq(UpdateProductPlanResponse);
      },
    );
  });

  it('Should [INITIALIZE FORM] successfully', () => {
    const { plan } = ProductPlanResponse.data.product;
    cy.get('select[name="usageCalculationType"]').should(
      'have.value',
      plan.usageCalculationType,
    );
    cy.get(
      `input[name="billingIntervalCount"][type="number"][placeholder="${localizations.en.billing_unit}"]`,
    ).should('have.value', plan.billingIntervalCount);

    cy.get(
      `input[name="trialIntervalCount"][type="number"][placeholder="${localizations.en.trial_unit}"]`,
    ).should('have.value', plan.trialIntervalCount);

    cy.get('select[name="billingInterval"]').should(
      'have.value',
      plan.billingInterval,
    );

    cy.get('select[name="trialInterval"]').should(
      'have.value',
      plan.trialInterval,
    );

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .should('not.be.disabled');
  });

  it('Should [ERROR] when  valid integer value is not provided', () => {
    cy.get(
      `input[name="billingIntervalCount"][type="number"][placeholder="${localizations.en.billing_unit}"]`,
    ).clear();

    cy.get(
      `input[name="trialIntervalCount"][type="number"][placeholder="${localizations.en.trial_unit}"]`,
    )
      .clear()
      .blur();

    cy.get(`input[type="submit"][aria-label="${localizations.en.save}"]`)
      .should('have.value', localizations.en.save)
      .should('be.disabled');

    cy.get('label[for="trialIntervalCount"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.trial_unit,
      ),
    );
    cy.get('label[for="billingIntervalCount"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.billing_unit,
      ),
    );
  });
});
