import { SingleUserResponse, UserListResponse, UserOperations } from '../mock/user.js';
import hasOperationName from '../utils/hasOperationName.ts';

const users = Array.from({ length: 60 }, (_, index) => ({
  ...UserListResponse.data.users[0],
  _id: `scroll-user-${index}`,
  username: `Scroll user ${index}`,
  name: `Scroll user ${index}`,
  deleted: null,
  cart: null,
  orders: [],
}));

const listLinks = 'a[href^="/users/?userId=scroll-user-"]';

const openDetail = () => {
  cy.get(listLinks).first().click({ force: true, scrollBehavior: false });
  cy.location('search').should('include', 'userId=scroll-user-0');
  cy.get('h2').should('contain.text', users[0].username);
};

const settleLayout = () => {
  cy.window().then(
    (win) =>
      new Cypress.Promise<void>((resolve) => {
        win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve()));
      }),
  );
};

const expectScroll = (y: number) => {
  settleLayout();
  cy.window().its('scrollY').should('be.closeTo', y, 2);
};

describe('List scroll restoration', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, UserOperations.GetUserList)) {
        req.reply({ data: { users, usersCount: users.length } });
      }
      if (
        hasOperationName(req, UserOperations.GetPermissions) ||
        hasOperationName(req, UserOperations.GetSingle)
      ) {
        req.reply({
          data: {
            user: {
              ...SingleUserResponse.data.user,
              ...users[0],
            },
          },
        });
      }
    });
    cy.visit('/users/');
    cy.get(listLinks).should('have.length.greaterThan', users.length);
  });

  it('returns to the same position after opening a query-based detail view', () => {
    cy.scrollTo(0, 1600);
    expectScroll(1600);
    openDetail();
    expectScroll(0);
    cy.go('back');
    cy.location('search').should('eq', '');
    expectScroll(1600);
    cy.go('forward');
    cy.location('search').should('include', 'userId=scroll-user-0');
    expectScroll(0);
    cy.go('back');
    expectScroll(1600);
  });

  it('keeps a separate position for each visit to the same list URL', () => {
    cy.scrollTo(0, 1600);
    openDetail();
    cy.get('a[href="/users/"]').first().click({ force: true });
    cy.location('search').should('eq', '');
    cy.get(listLinks).should('have.length.greaterThan', users.length);
    expectScroll(0);
    cy.scrollTo(0, 800);
    expectScroll(800);
    cy.go('back');
    cy.location('search').should('include', 'userId=scroll-user-0');
    cy.go('back');
    cy.location('search').should('eq', '');
    expectScroll(1600);
  });

  it('restores after the list has to be fetched again', () => {
    cy.visit('/users/?queryString=scroll');
    cy.get(listLinks).should('have.length.greaterThan', users.length);
    cy.scrollTo(0, 1600);
    openDetail();
    cy.reload();
    cy.get('h2').should('contain.text', users[0].username);
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, UserOperations.GetUserList)) {
        req.alias = 'delayedUsers';
        req.reply({
          delay: 500,
          body: { data: { users, usersCount: users.length } },
        });
      }
    });
    cy.go('back');
    cy.location('search').should('eq', '?queryString=scroll');
    cy.wait('@delayedUsers');
    expectScroll(1600);
  });

  ['user input', 'another navigation'].forEach((cancelWith) => {
    it(`stops waiting for a delayed list after ${cancelWith}`, () => {
      cy.visit('/users/?queryString=scroll');
      cy.get(listLinks).should('have.length.greaterThan', users.length);
      cy.scrollTo(0, 1600);
      openDetail();
      cy.reload();
      cy.get('h2').should('contain.text', users[0].username);

      let releaseUsers: () => void;
      cy.intercept('POST', '/graphql', (req) => {
        if (
          hasOperationName(req, UserOperations.GetUserList) &&
          req.body.variables.queryString === 'scroll'
        ) {
          req.alias = 'delayedUsers';
          return new Cypress.Promise<void>((resolve) => {
            releaseUsers = () => {
              req.reply({ data: { users, usersCount: users.length } });
              resolve();
            };
          });
        }
      });

      cy.go('back');
      cy.location('search').should('eq', '?queryString=scroll');
      cy.get(listLinks).should('not.exist');
      expectScroll(0);
      if (cancelWith === 'user input') {
        cy.window().then((win) => {
          win.document.body.dispatchEvent(
            new win.WheelEvent('wheel', { deltaY: 100, bubbles: true }),
          );
        });
      } else {
        cy.get('a[href="/users/"]').first().click({ force: true });
        cy.location('search').should('eq', '');
      }
      cy.then(() => releaseUsers());
      cy.wait('@delayedUsers');
      cy.get(listLinks).should('have.length.greaterThan', users.length);
      expectScroll(0);
    });
  });

  it('loads enough infinite-scroll pages to reach an uncached position', () => {
    let returning = false;
    cy.intercept('POST', '/graphql', (req) => {
      if (
        hasOperationName(req, UserOperations.GetUserList) &&
        req.body.variables.queryString === 'paginated'
      ) {
        const offset = req.body.variables.offset || 0;
        req.alias = `${returning ? 'return' : 'initial'}Page${offset}`;
        req.reply({
          delay: 100,
          body: {
            data: {
              // Start with an already populated list; after losing the cache,
              // the same scroll position requires fetching three pages.
              users: returning ? users.slice(offset, offset + 20) : users,
              usersCount: users.length,
            },
          },
        });
      }
    });

    cy.visit('/users/?queryString=paginated');
    cy.wait('@initialPage0');
    cy.get('a[href="/users/?userId=scroll-user-59"]').should('exist');
    cy.document().then((doc) => cy.scrollTo(0, doc.documentElement.scrollHeight));
    cy.window()
      .its('scrollY')
      .then((position) => {
        openDetail();
        cy.reload();
        cy.get('h2').should('contain.text', users[0].username);
        cy.then(() => {
          returning = true;
        });
        cy.go('back');
        cy.location('search').should('eq', '?queryString=paginated');
        cy.wait('@returnPage0');
        cy.wait('@returnPage20');
        cy.wait('@returnPage40');
        expectScroll(position);
      });
  });
});
