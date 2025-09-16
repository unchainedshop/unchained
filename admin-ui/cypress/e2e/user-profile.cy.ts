import localizations from '../../src/i18n';
import { LanguageOperations, LanguagesResponse } from '../mock/language';
import {
  createUserRequestVariables,
  CreateUserResponse,
  SingleUserResponse,
  SystemRolesResponse,
  UpdateUserResponse,
  UserListResponse,
  UserOperations,
  UserWebAuthCredentials,
} from '../mock/user';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

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
      if (hasOperationName(req, UserOperations.GetSingle)) {
        aliasQuery(req, UserOperations.GetSingle);
        req.reply(SingleUserResponse);
      }
      if (hasOperationName(req, UserOperations.UserWebAuthnCredentials)) {
        aliasQuery(req, UserOperations.UserWebAuthnCredentials);
        req.reply(UserWebAuthCredentials);
      }
      if (hasOperationName(req, UserOperations.SystemRoles)) {
        req.reply(SystemRolesResponse);
      }
      if (hasOperationName(req, UserOperations.CreateUser)) {
        aliasMutation(req, UserOperations.CreateUser);
        req.reply(CreateUserResponse);
      }
      if (hasOperationName(req, UserOperations.UpdateUser)) {
        aliasMutation(req, UserOperations.UpdateUser);
        req.reply(UpdateUserResponse);
      }
    });

    cy.visit('/');
    cy.get('a[href="/users"]')
      .contains(localizations.en.users)
      .click({ force: true });

    cy.wait(fullAliasName(UserOperations.GetUserList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeGuests: false,
          limit: 50,
          offset: 0,
          queryString: null,
        });
        expect(response.body).to.deep.eq(UserListResponse);
      },
    );
    cy.location('pathname').should('eq', '/users');
    cy.get('h2').should('contain.text', localizations.en.users);
  });

  it('Show Navigate to [USER] page successfully', () => {
    cy.get('li').should('have.length', 5);
  });

  it('Toggling status toggle should update route', () => {
    cy.get('button[role="switch"]').click();
    cy.wait(fullAliasName(UserOperations.GetUserList)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          includeGuests: true,
          limit: 50,
          offset: 0,
          queryString: null,
        });
        expect(currentSubject.response.body).to.deep.eq(UserListResponse);
      },
    );

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/users');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeGuests: 'true',
      });
    });
    cy.get('button[role="switch"]').click();
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/users');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeGuests: 'false',
      });
    });
  });

  it('should update data and route when [SEARCHING] accordingly', () => {
    cy.get('input[type="search"]').type('search');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/users');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search',
      });
    });
    cy.wait(fullAliasName(UserOperations.GetUserList)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          includeGuests: false,
          limit: 50,
          offset: 0,
          queryString: 'search',
        });
        expect(currentSubject.response.body).to.deep.eq(UserListResponse);
      },
    );

    cy.get('input[type="search"]').type(' input');

    cy.wait(fullAliasName(UserOperations.GetUserList)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables).to.deep.eq({
          includeGuests: false,
          limit: 50,
          offset: 0,
          queryString: 'search input',
        });
        expect(currentSubject.response.body).to.deep.eq(UserListResponse);
      },
    );
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/users');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        queryString: 'search input',
      });
    });
  });

  it('Should [FILTER] by multiple fields [STATUS & QUERY STRING]', () => {
    cy.get('button[role="switch"]').click();
    cy.wait(fullAliasName(UserOperations.GetUserList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeGuests: true,
          limit: 50,
          offset: 0,
          queryString: null,
        });
        expect(response.body).to.deep.eq(UserListResponse);
      },
    );
    cy.get('input[type="search"]').type('search');
    cy.wait(fullAliasName(UserOperations.GetUserList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          includeGuests: true,
          limit: 50,
          offset: 0,
          queryString: 'search',
        });
        expect(response.body).to.deep.eq(UserListResponse);
      },
    );

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/users');
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        includeGuests: 'true',
        queryString: 'search',
      });
    });
  });

  it('Show Navigate to [NEW USER] form page successfully', () => {
    cy.get('a[href="/users/new"]').contains(localizations.en.add).click();
    cy.location('pathname').should('eq', '/users/new');
  });

  it('Show [ADD USER] successfully', () => {
    const { enrollUser } = CreateUserResponse.data;
    cy.get('a[href="/users/new"]').contains(localizations.en.add).click();
    cy.location('pathname').should('eq', '/users/new');

    cy.location('pathname').should('eq', '/users/new');
    cy.get('input#email').type(createUserRequestVariables.email);
    cy.get('input#password').type(createUserRequestVariables.plainPassword);
    cy.get('input#displayName').type(
      createUserRequestVariables.profile.displayName,
    );
    cy.get('select#gender').select(createUserRequestVariables.profile.gender);
    cy.get('input[name="birthday"]').focus();
    cy.get('select.react-datepicker__month-select').select(3);
    cy.get('select.react-datepicker__year-select').select('1992');
    cy.get('div.react-datepicker__day.react-datepicker__day--011').click();
    cy.get('input#phoneMobile').type(
      createUserRequestVariables.profile.phoneMobile,
    );

    cy.get('input#firstName').type(
      createUserRequestVariables.profile.address.firstName,
    );
    cy.get('input#lastName').type(
      createUserRequestVariables.profile.address.lastName,
    );
    cy.get('input#company').type(
      createUserRequestVariables.profile.address.company,
    );
    cy.get('input#addressLine').type(
      createUserRequestVariables.profile.address.addressLine,
    );
    cy.get('input#addressLine2').type(
      createUserRequestVariables.profile.address.addressLine2,
    );
    cy.get('input#regionCode').type(
      createUserRequestVariables.profile.address.regionCode,
    );
    cy.get('input#postalCode').type(
      createUserRequestVariables.profile.address.postalCode,
    );
    cy.get('input#city').type(createUserRequestVariables.profile.address.city);
    cy.get('input#countryCode').type(
      createUserRequestVariables.profile.address.countryCode,
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.save)
      .last()
      .click();

    cy.wait(fullAliasMutationName(UserOperations.CreateUser)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect({
          ...request.body.variables,
          profile: {
            ...request.body.variables.profile,
            birthday: null,
          },
        }).to.deep.eq({
          ...createUserRequestVariables,
          profile: {
            ...createUserRequestVariables.profile,
            birthday: null,
          },
        });

        // eslint-disable-next-line no-unused-expressions
        expect(request.body.variables.profile.birthday).to.not.be.null;

        expect(response.body).to.deep.eq(CreateUserResponse);
      },
    );

    cy.location('pathname').should('contains', `/users?userId=${enrollUser._id}`);
  });

  it('Show [CANCEL USER] successfully on new user', () => {
    cy.location('pathname').should('eq', '/users');

    cy.get('a[href="/users/new"]').contains(localizations.en.add).click();
    cy.location('pathname').should('eq', '/users/new');

    cy.get('input#email').type('redi@hotmail.com');
    cy.get('input#firstName').type('Rediet');

    cy.get('button').contains(localizations.en.cancel).click();

    cy.location('pathname').should('contains', '/users');
  });

  it('Show [ERROR] when required fields are not provided in add user', () => {
    cy.location('pathname').should('eq', '/users');

    cy.get('a[href="/users/new"]').contains(localizations.en.add).click();
    cy.location('pathname').should('eq', '/users/new');

    cy.get('input[name="birthday"]').clear();
    cy.get('input[type="submit"]')
      .contains(localizations.en.save)
      .last()
      .click();

    cy.get('label[for="email"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_email,
        localizations.en.email,
      ),
    );

    cy.get('input[type="submit"]')
      .contains(localizations.en.save)
      .should('be.disabled');
  });

  it('Show [INITIALIZE USER] successfully', () => {
    const { user } = SingleUserResponse.data;

    cy.location('pathname').should('eq', '/users');
    cy.get(`a[href="/users?userId=${user._id}"]`).click();
    cy.location('pathname').should('eq', `/users?userId=${user._id}`);

    cy.wait(fullAliasName(UserOperations.GetSingle)).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        userId: user._id,
      });
      expect(response.body).to.deep.eq(SingleUserResponse);
    });

    cy.get('[data-id="cancel_update"]').first().click();
    cy.get('input#displayName').should('have.value', user.profile.displayName);
    cy.get('select#gender').should('have.value', user.profile.gender);
    cy.get('input#phoneMobile').should('have.value', user.profile.phoneMobile);

    cy.get('input#firstName').should(
      'have.value',
      user.profile.address.firstName,
    );
    cy.get('input#lastName').should(
      'have.value',
      user.profile.address.lastName,
    );
    cy.get('input#company').should('have.value', user.profile.address.company);
    cy.get('input#addressLine').should(
      'have.value',
      user.profile.address.addressLine,
    );
    cy.get('input#addressLine2').should(
      'have.value',
      user.profile.address.addressLine2,
    );
    cy.get('input#regionCode').should(
      'have.value',
      user.profile.address.regionCode,
    );
    cy.get('input#postalCode').should(
      'have.value',
      user.profile.address.postalCode,
    );
    cy.get('input#city').should('have.value', user.profile.address.city);
    cy.get('input#countryCode').should(
      'have.value',
      user.profile.address.countryCode,
    );
  });

  it('Show [UPDATE USER] successfully', () => {
    const { user } = SingleUserResponse.data;

    cy.location('pathname').should('eq', '/users');
    cy.get(`a[href="/users?userId=${user._id}"]`).click();
    cy.location('pathname').should('eq', `/users?userId=${user._id}`);

    cy.get('[data-id="cancel_update"]').first().click();

    cy.get('input#displayName').clear().type(user.profile.displayName);
    cy.get('input[name="birthday"]').focus();
    cy.get('select.react-datepicker__month-select').select(3);
    cy.get('select.react-datepicker__year-select').select('1992');
    cy.get('div.react-datepicker__day.react-datepicker__day--011').click();

    cy.get('input[type="submit"]')
      .contains(localizations.en.save)
      .last()
      .click();

    cy.wait(fullAliasMutationName(UserOperations.UpdateUser)).then(
      (currentSubject) => {
        expect({
          ...currentSubject.request.body.variables,
          profile: {
            ...currentSubject.request.body.variables.profile,
            birthday: null,
          },
        }).to.deep.eq({
          profile: {
            ...createUserRequestVariables.profile,
            birthday: null,
          },
          userId: user._id,
        });
        expect(currentSubject.response.body).to.deep.eq(UpdateUserResponse);
      },
    );
  });

  it('Show [CANCEL UPDATE USER] successfully', () => {
    const { user } = SingleUserResponse.data;

    cy.location('pathname').should('eq', '/users');
    cy.get(`a[href="/users?userId=${user._id}"]`).click();
    cy.location('pathname').should('eq', `/users?userId=${user._id}`);

    cy.get('[data-id="cancel_update"]').last().click();
    cy.get('input#displayName').clear().type(user.profile.displayName);
    cy.get('button').contains(localizations.en.cancel).last().click();

    cy.location('pathname').should('eq', `/users?userId=${user._id}`);
  });
});
