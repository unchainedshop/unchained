import localizations from '../../src/i18n';
import {
  AuthenticationOperations,
  EmailExistsEnrollmentErrorResponse,
  EnrollmentSuccessResponse,
} from '../mock/authorization';
import { CurrentUserResponse, UserOperations } from '../mock/user';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Sign Up', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      const { body } = req;
      if (hasOperationName(req, AuthenticationOperations.CreateUser)) {
        aliasMutation(req, AuthenticationOperations.CreateUser);
        const { variables } = body;

        if (variables.email !== 'new@unchained.shop')
          req.reply(EmailExistsEnrollmentErrorResponse);
        else
          req.reply(EnrollmentSuccessResponse, {
            'set-cookie':
              'token=328eca624071dbdf9eac8e12d3fe7f88142408341ee; Path=/; Expires=Sun, 15 Jan 2023 19:50:22 GMT; HttpOnly; SameSite=None',
          });
      }

      if (hasOperationName(req, UserOperations.CurrentUser)) {
        aliasQuery(req, UserOperations.CurrentUser);
        if (req.headers?.cookie && req.headers?.cookie.includes('token')) {
          req.reply(CurrentUserResponse);
        } else {
          req.reply({ data: { impersonator: null, me: null } });
        }
      }
    });

    cy.visit('/');
    cy.location('pathname').should('eq', '/log-in');
    cy.get('a[href="/sign-up"]')
      .should('contain.text', localizations.en.sign_up)
      .click();
    cy.location('pathname').should('eq', '/sign-up');
    cy.get('h2').should('contain.text', localizations.en.sign_up_header);
  });

  it('Should [CREATE USER] successfully', () => {
    cy.get('input[name="username"]').type('new');
    cy.get('input[name="email"]').type('new@unchained.shop');
    cy.get('input[name="plainPassword"]').type('password');
    cy.get('button[type="submit"]')
      .should('contain.text', localizations.en.sign_up)
      .click();
    cy.wait(fullAliasMutationName(AuthenticationOperations.CreateUser)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          email: 'new@unchained.shop',
          plainPassword: 'password',

          username: 'new',
        });
        expect(response.body).to.deep.eq(EnrollmentSuccessResponse);
      },
    );

    // TODO: Investigate why this request is made further
    cy.wait(fullAliasName(UserOperations.CurrentUser)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq({
          data: { impersonator: null, me: null },
        });
      },
    );

    cy.location('pathname').should('eq', '/account');

    cy.wait(fullAliasName(UserOperations.CurrentUser)).then(
      (currentSubject) => {
        const { response } = currentSubject;

        expect(response.body).to.deep.eq(CurrentUserResponse);
      },
    );
  });

  it('Should [RETURN ERROR] when [EMAIL EXISTS] ', () => {
    cy.wait(fullAliasName(UserOperations.CurrentUser)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq({
          data: { impersonator: null, me: null },
        });
      },
    );

    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="email"]').type('admin@unchained.shop');
    cy.get('input[name="plainPassword"]').type('password');
    cy.get('button[type="submit"]')
      .should('contain', localizations.en.sign_up)
      .click();
    cy.wait(fullAliasMutationName(AuthenticationOperations.CreateUser)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          email: 'admin@unchained.shop',
          plainPassword: 'password',

          username: 'admin',
        });
        expect(response.body).to.deep.eq(EmailExistsEnrollmentErrorResponse);
      },
    );

    cy.location('pathname').should('eq', '/sign-up');
  });

  it('Should [ERROR] when [REQUIRED] fields are missing ', () => {
    cy.wait(fullAliasName(UserOperations.CurrentUser)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq({
          data: { impersonator: null, me: null },
        });
      },
    );
    cy.get('button[type="submit"]')
      .should('contain.text', localizations.en.sign_up)
      .click();
    cy.get('label[for="email"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.email,
      ),
    );
    cy.get('label[for="plainPassword"]').should(
      'contain',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.password,
      ),
    );

    cy.location('pathname').should('eq', '/sign-up');
  });

  it('Should  navigate back to [LOG IN PAGE] successfully ', () => {
    cy.get('a[href="/log-in"]')
      .should('contain.text', localizations.en.log_in)
      .click();
    cy.location('pathname').should('eq', '/log-in');
  });
});
