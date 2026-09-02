import localizations from '../../src/i18n';
import {
  CurrentUserResponse,
  TargetUserResponse,
  UserListResponse,
  UserOperations,
} from '../mock/user';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';

describe('Target user permissions', () => {
  let viewerAllowedActions: string[];

  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, UserOperations.GetUserList)) {
        expect(req.body.query).not.to.contain('viewerAllowedActions');
        aliasQuery(req, UserOperations.GetUserList);
        req.reply(UserListResponse);
      }

      if (hasOperationName(req, UserOperations.GetPermissions)) {
        expect(req.body.query).to.contain('viewerAllowedActions');
        expect(req.body.variables).to.deep.include({
          userId: TargetUserResponse.data.user._id,
        });
        aliasQuery(req, UserOperations.GetPermissions);
        req.reply({
          data: {
            user: {
              _id: TargetUserResponse.data.user._id,
              viewerAllowedActions,
            },
          },
        });
      }

      if (hasOperationName(req, UserOperations.GetSingle)) {
        expect(req.body.query).not.to.contain('viewerAllowedActions');
        expect(req.body.variables).to.deep.include({
          userId: TargetUserResponse.data.user._id,
          includePrivateInfos: viewerAllowedActions.includes(
            'viewUserPrivateInfos',
          ),
          includeRoles: viewerAllowedActions.includes('viewUserRoles'),
          includeOrders: viewerAllowedActions.includes('viewUserOrders'),
        });
        aliasQuery(req, UserOperations.GetSingle);
        req.reply(TargetUserResponse);
      }
    });
  });

  const visitTargetAccount = () => {
    expect(TargetUserResponse.data.user._id).not.to.eq(
      CurrentUserResponse.data.me._id,
    );
    cy.visit(`/users/?userId=${TargetUserResponse.data.user._id}&tab=account`);
    cy.wait(fullAliasName(UserOperations.GetPermissions));
    cy.wait(fullAliasName(UserOperations.GetSingle));
  };

  it('keeps target capabilities out of the user list query', () => {
    cy.visit('/users/');
    cy.wait(fullAliasName(UserOperations.GetUserList));

    cy.get(`button[aria-label="${localizations.en.table_actions_menu}"]`)
      .first()
      .click();
    cy.contains('button', localizations.en.edit).should('be.visible');
    cy.contains('button', localizations.en.delete).should('not.exist');
  });

  it('does not expose force logout through the viewer flat action list', () => {
    expect(CurrentUserResponse.data.me.allowedActions).to.include(
      'logoutAllSessions',
    );
    expect(CurrentUserResponse.data.me.allowedActions).to.include('removeUser');
    viewerAllowedActions = ['updateUser', 'viewUser', 'viewUserPublicInfos'];

    visitTargetAccount();

    cy.contains('h3', localizations.en.set_password).should('be.visible');
    cy.contains('h3', localizations.en.email_addresses).should('not.exist');
    cy.contains('h3', localizations.en.sessions).should('not.exist');
    cy.contains('button', localizations.en.force_logout).should('not.exist');
    cy.contains('button', localizations.en.delete).should('not.exist');
  });

  it('exposes force logout only when it is allowed for the target user', () => {
    viewerAllowedActions = [
      'logoutAllSessions',
      'viewUser',
      'viewUserPublicInfos',
    ];

    visitTargetAccount();

    cy.contains('h3', localizations.en.set_password).should('not.exist');
    cy.contains('h3', localizations.en.sessions).should('be.visible');
    cy.contains('button', localizations.en.force_logout).should('be.visible');
  });

  it('exposes detail deletion only when it is allowed for the target user', () => {
    viewerAllowedActions = ['removeUser', 'viewUser', 'viewUserPublicInfos'];

    visitTargetAccount();

    cy.contains('button', localizations.en.delete).should('be.visible');
    cy.contains('h3', localizations.en.sessions).should('not.exist');
  });
});
