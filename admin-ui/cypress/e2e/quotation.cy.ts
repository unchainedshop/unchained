import {
  SingleQuotationResponse,
  UserQuotationsListResponse,
} from '../mock/user';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';

const QuotationOperations = {
  GetQuotations: 'Quotations',
  GetQuotation: 'Quotation',
};

const QuotationsListResponse = {
  data: {
    quotations: UserQuotationsListResponse.data.user.quotations,
    quotationsCount: UserQuotationsListResponse.data.user.quotations.length,
  },
};

describe('Quotation', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, QuotationOperations.GetQuotations)) {
        aliasQuery(req, QuotationOperations.GetQuotations);
        req.reply(QuotationsListResponse);
      }
      if (hasOperationName(req, QuotationOperations.GetQuotation)) {
        aliasQuery(req, QuotationOperations.GetQuotation);
        req.reply(SingleQuotationResponse);
      }
    });

    cy.visit('/quotations');
    cy.wait(fullAliasName(QuotationOperations.GetQuotations));
  });

  it('Should navigate to [QUOTATIONS] page successfully', () => {
    cy.location('pathname').should('eq', '/quotations/');
    cy.get('tr').should('have.length.gte', 1);
  });

  it('Should display quotation list with correct data', () => {
    const [firstQuotation] = QuotationsListResponse.data.quotations;
    cy.contains(firstQuotation.quotationNumber).should('be.visible');
  });

  it('Should navigate to [QUOTATION DETAIL] page successfully', () => {
    const { quotation } = SingleQuotationResponse.data;

    cy.get(`a[href="/quotations/?quotationId=${quotation._id}"]`)
      .first()
      .click();

    cy.wait(fullAliasName(QuotationOperations.GetQuotation)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables.quotationId).to.eq(
          quotation._id,
        );
      },
    );

    cy.url().should(
      'include',
      `/quotations/?quotationId=${quotation._id}`,
    );
    cy.contains(quotation.quotationNumber).should('be.visible');
  });

  it('Should display quotation product info in detail', () => {
    const { quotation } = SingleQuotationResponse.data;

    cy.get(`a[href="/quotations/?quotationId=${quotation._id}"]`)
      .first()
      .click();

    cy.wait(fullAliasName(QuotationOperations.GetQuotation));

    cy.contains(quotation.product.texts.title).should('be.visible');
  });
});
