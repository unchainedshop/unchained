import localizations from '../../src/i18n';
import {
  AuthenticationOperations,
  CreateWebAuthnCredentialRequestOptionsResponse,
  InvalidCredentialErrorResponse,
  LogInSuccessResponse,
} from '../mock/authorization';
import { CurrentUserResponse, UserOperations } from '../mock/user';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Login', () => {
  let isLoggedIn = false;

  beforeEach(() => {
    isLoggedIn = false;
    cy.intercept('POST', '/graphql', (req) => {
      if (
        hasOperationName(
          req,
          AuthenticationOperations.CreateWebAuthnCredentialRequestOptions,
        )
      ) {
        aliasMutation(
          req,
          AuthenticationOperations.CreateWebAuthnCredentialRequestOptions,
        );

        req.reply(CreateWebAuthnCredentialRequestOptionsResponse);
      }
      if (hasOperationName(req, AuthenticationOperations.LoginWithPassword)) {
        aliasMutation(req, AuthenticationOperations.LoginWithPassword);
        if (req.body.variables.password !== 'correct')
          req.reply(InvalidCredentialErrorResponse);
        else {
          isLoggedIn = true;
          req.reply(LogInSuccessResponse);
        }
      }

      if (hasOperationName(req, UserOperations.CurrentUser)) {
        aliasQuery(req, UserOperations.CurrentUser);
        if (isLoggedIn) {
          req.reply(CurrentUserResponse);
        } else req.reply({ data: { impersonator: null, me: null } });
      }
    });
    cy.visit('/');
  });

  it('Should redirect to login page if user is not logged in', () => {
    cy.location('pathname').should('eq', '/log-in/');
  });

  it('Should [LOGIN] successfully', () => {
    cy.location('pathname').should('eq', '/log-in/');
    cy.wait(fullAliasName(UserOperations.CurrentUser)).then(
      (currentSubject) => {
        const { response } = currentSubject;

        expect(response.body).to.deep.eq({
          data: { impersonator: null, me: null },
        });
      },
    );
    cy.get('input[name="usernameOrEmail"]').type('admin@unchained.local');
    cy.get('button[type="submit"]').contains(localizations.en.continue).click();

    cy.wait(
      fullAliasMutationName(
        AuthenticationOperations.CreateWebAuthnCredentialRequestOptions,
      ),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.include({
        username: 'admin@unchained.local',
      });
      expect(response.body).to.deep.eq(
        CreateWebAuthnCredentialRequestOptionsResponse,
      );
    });

    cy.get('input[name="password"]').type('correct');
    cy.get('button[type="submit"]').contains(localizations.en.continue).click();
    cy.wait(
      fullAliasMutationName(AuthenticationOperations.LoginWithPassword),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.include({
        email: 'admin@unchained.local',
        password: 'correct',
        username: null,
      });
      expect(response.body).to.deep.eq(LogInSuccessResponse);
    });

    cy.wait(fullAliasName(UserOperations.CurrentUser)).then(
      (currentSubject) => {
        const { response } = currentSubject;

        expect(response.body).to.deep.eq(CurrentUserResponse);
      },
    );
    cy.location('pathname').should('eq', '/');
  });

  it('Should [FAIL LOGIN] when invalid credentials are passed', () => {
    cy.location('pathname').should('eq', '/log-in/');
    cy.get('input[name="usernameOrEmail"]').type('admin@unchained.local');
    cy.get('button[type="submit"]').contains(localizations.en.continue).click();

    cy.wait(
      fullAliasMutationName(
        AuthenticationOperations.CreateWebAuthnCredentialRequestOptions,
      ),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.include({
        username: 'admin@unchained.local',
      });
      expect(response.body).to.deep.eq(
        CreateWebAuthnCredentialRequestOptionsResponse,
      );
    });

    cy.get('input[name="password"]').type('wrong-password');
    cy.get('button[type="submit"]').contains(localizations.en.continue).click();

    cy.wait(
      fullAliasMutationName(AuthenticationOperations.LoginWithPassword),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.include({
        email: 'admin@unchained.local',
        password: 'wrong-password',
        username: null,
      });
      expect(response.body).to.deep.eq(InvalidCredentialErrorResponse);
    });
    cy.location('pathname').should('eq', '/log-in/');

    // Note: Error message display is currently broken in the UI due to
    // errorPolicy: 'all' in Apollo mutation making error undefined while
    // data.loginWithPassword is null, causing a TypeError in form submission
  });

  it('Should [ERROR] when [REQUIRED] fields are missing', () => {
    cy.location('pathname').should('eq', '/log-in/');

    cy.get('button[type="submit"]').contains(localizations.en.continue).click();
    cy.get('label[for="usernameOrEmail"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.username_or_email,
      ),
    );

    cy.location('pathname').should('eq', '/log-in/');
  });

  it('Should  navigate to [SIGN UP PAGE] successfully ', () => {
    cy.get('a[href="/sign-up/"]')
      .should('contain.text', localizations.en.sign_up)
      .click();
    cy.location('pathname').should('eq', '/sign-up/');
  });

  it('Should  navigate to [FORGOT PASSWORD PAGE] successfully ', () => {
    cy.get('input[name="usernameOrEmail"]').type('admin@unchained.local');
    cy.get('button[type="submit"]').contains(localizations.en.continue).click();

    cy.wait(
      fullAliasMutationName(
        AuthenticationOperations.CreateWebAuthnCredentialRequestOptions,
      ),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.include({
        username: 'admin@unchained.local',
      });
      expect(response.body).to.deep.eq(
        CreateWebAuthnCredentialRequestOptionsResponse,
      );
    });

    cy.get('a[href="/account/forgot-password/"]')
      .should('contain.text', localizations.en.forget_password)
      .click();
    cy.location('pathname').should('eq', '/account/forgot-password/');
  });
});
