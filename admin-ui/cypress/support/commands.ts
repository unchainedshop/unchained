// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

import hasOperationName from '../utils/hasOperationName';
import { ShopInfoOperations, ShopInfoResponse } from '../mock/shop-info';
import {
  CurrentUserResponse,
  SystemRolesResponse,
  UserOperations,
  UserWebAuthCredentials,
} from '../mock/user';
import { OrderListResponse, OrderOperations } from '../mock/order';
import { LanguageOperations, LanguagesResponse } from '../mock/language';
import { aliasQuery } from '../utils/aliasQuery';
import { AuthenticationOperations } from '../mock/authorization';

beforeEach(() => {
  cy.intercept('OPTIONS', '/chat', (req) => {
    req.reply(200);
  })
  cy.intercept('POST', '/graphql', (req) => {
    if (hasOperationName(req, OrderOperations.GetOrderList)) {
      aliasQuery(req, `global${OrderOperations.GetOrderList}`);
      req.reply(OrderListResponse);
    }

    if (hasOperationName(req, UserOperations.CurrentUser)) {
      aliasQuery(req, `global${UserOperations.CurrentUser}`);
      req.reply(CurrentUserResponse);
    }

    if (hasOperationName(req, ShopInfoOperations.ShopInfo)) {
      req.reply(ShopInfoResponse);
    }
    if (hasOperationName(req, ShopInfoOperations.SystemRoles)) {
      req.reply(SystemRolesResponse);
    }

    if (
      hasOperationName(req, AuthenticationOperations.UserWebAuthnCredentials)
    ) {
      req.reply(UserWebAuthCredentials);
    }

    if (
      hasOperationName(req, LanguageOperations.GetLanguagesList) &&
      !req.headers.referer.includes('language')
    ) {
      req.reply(LanguagesResponse);
    }
  });
  cy.viewport(1200, 800);
});

Cypress.on('uncaught:exception', () => {
  return false;
});
