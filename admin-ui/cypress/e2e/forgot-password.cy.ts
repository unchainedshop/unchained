import localizations from '../../src/i18n';
import {
  AuthenticationOperations,
  CreateWebAuthnCredentialRequestOptionsResponse,
  ForgotPasswordFailedResponse,
  ForgotPasswordSuccessResponse,
} from '../mock/authorization';
import { UserOperations } from '../mock/user';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Forgot password', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      const { body } = req;
      if (hasOperationName(req, AuthenticationOperations.ForgotPassword)) {
        const { variables } = body;
        aliasMutation(req, AuthenticationOperations.ForgotPassword);
        if (variables.email === 'admin@unchained.shop')
          req.reply(ForgotPasswordSuccessResponse);
        else req.reply(ForgotPasswordFailedResponse);
      }

      if (hasOperationName(req, UserOperations.CurrentUser)) {
        req.reply({ data: { me: null } });
      }
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
    });

    cy.visit('/');
    cy.location('pathname').should('eq', '/log-in');
    cy.get('input[name="usernameOrEmail"]').type('admin@unchained.local');
    cy.get('button[type="submit"]').contains(localizations.en.continue).click();
    cy.get('a[href="/account/forgot-password"]')
      .contains(localizations.en.forget_password)
      .click();
    cy.location('pathname').should('eq', '/account/forgot-password');
    cy.get('h2').should('contain.text', localizations.en.forget_password);
  });

  it('Should [SEND RESET LINK] successfully when provided valid email address', () => {
    cy.get('input[name="email"]').type('admin@unchained.shop');
    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.send_reset_link)
      .click();

    cy.wait(
      fullAliasMutationName(AuthenticationOperations.ForgotPassword),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        email: 'admin@unchained.shop',
      });
      expect(response.body).to.deep.eq(ForgotPasswordSuccessResponse);
    });
  });

  it('Should [FAIL] when provided wrong email', () => {
    cy.get('input[name="email"]').type('wrong@unchained.local');
    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.send_reset_link)
      .click();

    cy.wait(
      fullAliasMutationName(AuthenticationOperations.ForgotPassword),
    ).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        email: 'wrong@unchained.local',
      });
      expect(response.body).to.deep.eq(ForgotPasswordFailedResponse);
    });
    cy.get('label[for="email"]').should(
      'contain.text',
      localizations.en.email_address_not_exist,
    );
  });

  it('Should [ERROR] email is not provided', () => {
    cy.get('input[type="submit"]')
      .should('have.value', localizations.en.send_reset_link)
      .click();

    cy.get('label[for="email"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_email,
        localizations.en.email_address,
      ),
    );
  });

  it('Should  navigate to [SIGN UP PAGE] successfully ', () => {
    cy.get('a[href="/sign-up"]')
      .should('contain.text', localizations.en.sign_up)
      .click();
    cy.location('pathname').should('eq', '/sign-up');
  });
});
