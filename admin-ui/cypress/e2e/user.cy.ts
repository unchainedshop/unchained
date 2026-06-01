import localizations from '../../src/i18n';
import { DeliveryProvidersTypeResponse } from '../mock/delivery-provider';
import { LanguageOperations, LanguagesResponse } from '../mock/language';
import { PaymentProvidersTypeResponse } from '../mock/payment-provider';
import {
  GetSingleOrderResponse,
  OrderDeliveryStatusResponse,
  OrderPaymentStatusResponse,
  OrderStatusResponse,
  SingleEnrollmentResponse,
  SingleOrderResponse,
  SingleQuotationResponse,
  SingleUserResponse,
  SystemRolesResponse,
  UserEnrollmentsListResponse,
  UserListResponse,
  UserOperations,
  UserOrderListResponse,
  UserQuotationsListResponse,
} from '../mock/user';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';

describe('User', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, LanguageOperations.GetLanguagesList)) {
        req.reply(LanguagesResponse);
      }
      if (hasOperationName(req, UserOperations.GetUserList)) {
        aliasQuery(req, UserOperations.GetUserList);
        req.reply(UserListResponse);
      }
      if (hasOperationName(req, UserOperations.GetEnrollment)) {
        aliasQuery(req, UserOperations.GetEnrollment);
        req.reply(SingleEnrollmentResponse);
      }

      if (hasOperationName(req, UserOperations.GetQuotation)) {
        aliasQuery(req, UserOperations.GetQuotation);
        req.reply(SingleQuotationResponse);
      }
      if (hasOperationName(req, UserOperations.GetSingle)) {
        aliasQuery(req, UserOperations.GetSingle);
        req.reply(SingleUserResponse);
      }
      if (hasOperationName(req, UserOperations.SystemRoles)) {
        req.reply(SystemRolesResponse);
      }
      if (hasOperationName(req, UserOperations.UserOrder)) {
        const { body } = req;
        if (body.variables?.queryString) {
          aliasQuery(req, UserOperations.UserOrder);
        }
        req.reply(UserOrderListResponse);
      }
      if (hasOperationName(req, UserOperations.UserQuotations)) {
        aliasQuery(req, UserOperations.UserQuotations);
        req.reply(UserQuotationsListResponse);
      }
      if (hasOperationName(req, UserOperations.UserEnrollments)) {
        aliasQuery(req, UserOperations.UserEnrollments);
        req.reply(UserEnrollmentsListResponse);
      }
      if (hasOperationName(req, UserOperations.OrderStatus)) {
        req.reply(OrderStatusResponse);
      }
      if (hasOperationName(req, UserOperations.OrderPaymentStatus)) {
        req.reply(OrderPaymentStatusResponse);
      }
      if (hasOperationName(req, UserOperations.PaymentProvidersType)) {
        req.reply(PaymentProvidersTypeResponse);
      }
      if (hasOperationName(req, UserOperations.OrderDeliveryStatus)) {
        req.reply(OrderDeliveryStatusResponse);
      }
      if (hasOperationName(req, UserOperations.DeliveryProvidersType)) {
        req.reply(DeliveryProvidersTypeResponse);
      }
      if (hasOperationName(req, UserOperations.GetSingleOrder)) {
        req.reply(GetSingleOrderResponse);
      }
    });

    cy.viewport(1200, 800);
    cy.visit('/');
    cy.get('a[href="/users/"]')
      .contains(localizations.en.users)
      .click({ force: true });

    cy.location('pathname').should('eq', '/users/');
    cy.get('h2').should('contain.text', localizations.en.users);
  });

  context('Order Tab', () => {
    beforeEach(() => {
      const { user } = SingleUserResponse.data;
      cy.get(`a[href="/users/?userId=${user._id}"]`).first().click();
      cy.url().should('include', `/users/?userId=${user._id}`);
      cy.get('h2').should(
        'contain.text',
        user.username,
      );

      cy.get(`a#orders`).contains(localizations.en.orders).click();
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          userId: user._id,
          tab: 'orders',
        });
      });
    });
    it('Show Navigate to [USER ORDER] page successfully', () => {
      cy.get('tr').should('have.length', 2);
    });

    it('Show Navigate to [ORDER] page successfully', () => {
      const { order } = SingleOrderResponse.data;
      cy.get(`a[href="/orders/?orderId=${order._id}"]`).first().click();
      cy.url().should('include', `/orders/?orderId=${order._id}`);
    });

    it('should update data and route when [SEARCHING] accordingly', () => {
      const { user } = SingleUserResponse.data;

      cy.get('input[type="search"]').focus().type('sea');

      cy.location().should((current) => {
        expect(convertURLSearchParamToObj(current.search)).to.deep.include({
          queryString: 'sea',
        });
      });
      cy.get('input[type="search"]').focus().type('rch');

      cy.location().should((current) => {
        expect(convertURLSearchParamToObj(current.search)).to.deep.include({
          userId: user._id,
          tab: 'orders',
          queryString: 'search',
        });
      });
    });
  });

  context('Quotations Tab', () => {
    beforeEach(() => {
      const { user } = SingleUserResponse.data;
      cy.get(`a[href="/users/?userId=${user._id}"]`).first().click();
      cy.url().should('include', `/users/?userId=${user._id}`);
      cy.get('h2').should(
        'contain.text',
        user.username,
      );
      cy.get(`a#quotations`).contains(localizations.en.quotations).click();
      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
          userId: user._id,
          tab: 'quotations',
        });
      });
    });
    it('Show Navigate to [USER QUOTATIONS] page successfully', () => {
      cy.wait(fullAliasName(UserOperations.UserQuotations)).then(
        (currentSelection) => {
          expect(currentSelection.response.body).to.deep.eq(
            UserQuotationsListResponse,
          );
        },
      );

      cy.get('tr').should('have.length', 2);
    });

    it('should update data and route when [SEARCHING] accordingly', () => {
      const { user } = SingleUserResponse.data;
      cy.wait(fullAliasName(UserOperations.UserQuotations)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserQuotationsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: '',
          });
        },
      );
      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
          userId: user._id,
          tab: 'quotations',
        });
      });

      cy.get('input[type="search"]').type('s');

      cy.wait(fullAliasName(UserOperations.UserQuotations)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserQuotationsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: 's',
          });
        },
      );

      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.include({
          userId: user._id,
          tab: 'quotations',
          queryString: 's',
        });
      });

      cy.get('input[type="search"]').type('a');

      cy.wait(fullAliasName(UserOperations.UserQuotations)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserQuotationsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: 'sa',
          });
        },
      );
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          userId: user._id,
          tab: 'quotations',
          queryString: 'sa',
        });
      });
    });

    it('Show Navigate to [QUOTATIONS] page successfully', () => {
      const { user } = SingleUserResponse.data;
      const [quotation] = UserQuotationsListResponse.data.user.quotations;
      cy.wait(fullAliasName(UserOperations.UserQuotations)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserQuotationsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: '',
          });
        },
      );

      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
          userId: user._id,
          tab: 'quotations',
        });
      });
      cy.get(`a[href="/quotations/?quotationId=${quotation._id}"]`).first().click();

      cy.url().should('include', `/quotations/?quotationId=${quotation._id}`);
    });
  });

  context('Enrollments Tab', () => {
    beforeEach(() => {
      const { user } = SingleUserResponse.data;
      cy.get(`a[href="/users/?userId=${user._id}"]`).first().click();
      cy.url().should('include', `/users/?userId=${user._id}`);
      cy.get('h2').should(
        'contain.text',
        user.username,
      );
      cy.get(`a#enrollments`).contains(localizations.en.enrollments).click();
      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
          userId: user._id,
          tab: 'enrollments',
        });
      });
    });

    it('Show Navigate to [USER ENROLLMENTS] page successfully', () => {
      const { user } = SingleUserResponse.data;
      cy.wait(fullAliasName(UserOperations.UserEnrollments)).then(
        (currentSelection) => {
          const { request, response } = currentSelection;
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: '',
          });
          expect(response.body).to.deep.eq(UserEnrollmentsListResponse);
        },
      );
      cy.get('tr').should('have.length', 4);
    });

    it('Should update data and route when [SEARCHING ENROLLMENT] accordingly', () => {
      const { user } = SingleUserResponse.data;
      cy.wait(fullAliasName(UserOperations.UserEnrollments)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserEnrollmentsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: '',
          });
        },
      );
      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
          userId: user._id,
          tab: 'enrollments',
        });
      });

      cy.get('input[type="search"]').type('s');

      cy.wait(fullAliasName(UserOperations.UserEnrollments)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserEnrollmentsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: 's',
          });
        },
      );

      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.include({
          userId: user._id,
          tab: 'enrollments',
          queryString: 's',
        });
      });

      cy.get('input[type="search"]').type('a');

      cy.wait(fullAliasName(UserOperations.UserEnrollments)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserEnrollmentsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: 'sa',
          });
        },
      );
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          userId: user._id,
          tab: 'enrollments',
          queryString: 'sa',
        });
      });
    });

    it('Show Navigate to [ENROLLMENTS] page successfully', () => {
      const { user } = SingleUserResponse.data;
      const [enrollment] = UserEnrollmentsListResponse.data.user.enrollments;
      cy.wait(fullAliasName(UserOperations.UserEnrollments)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(response.body).to.deep.eq(UserEnrollmentsListResponse);
          expect(request.body.variables).to.deep.include({
            userId: user._id,
            queryString: '',
          });
        },
      );

      cy.location().then((loc) => {
        expect(loc.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
          userId: user._id,
          tab: 'enrollments',
        });
      });
      cy.get(`a[href="/enrollments/?enrollmentId=${enrollment._id}"]`).first().click();

      cy.url().should('include', `/enrollments/?enrollmentId=${enrollment._id}`);
    });
  });

  context('Payment Credentials Tab', () => {
    it('Show Navigate to [USER PAYMENT CREDENTIALS] page successfully', () => {
      const { user } = SingleUserResponse.data;

      cy.get(`a[href="/users/?userId=${user._id}"]`).first().click();
      cy.url().should('include', `/users/?userId=${user._id}`);

      cy.get(`a#payment_credentials`)
        .contains(localizations.en.payment_credentials)
        .click();
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          userId: user._id,
          tab: 'payment_credentials',
        });
      });
      cy.get('li.py-4').should('have.length', 3);
    });

    it('Show Navigate to [USER PAYMENT CREDENTIALS ON MOBILE] page successfully', () => {
      const { user } = SingleUserResponse.data;
      cy.viewport(800, 400);

      cy.location('pathname').should('eq', '/users/');
      cy.get(`a[href="/users/?userId=${user._id}"]`).first().click();
      cy.url().should('include', `/users/?userId=${user._id}`);

      cy.get(`select#selected-tab`).select('payment_credentials');

      cy.get('li.py-4').should('have.length', 3);

      cy.location().then((current) => {
        expect(current.pathname).to.eq('/users/');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          userId: user._id,
          tab: 'payment_credentials',
        });
      });
    });
  });
});
