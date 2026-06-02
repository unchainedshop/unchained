import localizations from '../../src/i18n';
import {
  EventOperations,
  EventsListResponse,
  EventsTypeResponse,
  SingleEventResponse,
} from '../mock/event';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';

describe('Events ', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, EventOperations.GetEventList)) {
        aliasQuery(req, EventOperations.GetEventList);
        req.reply(EventsListResponse);
      }
      if (hasOperationName(req, EventOperations.GetSingleEvent)) {
        aliasQuery(req, EventOperations.GetSingleEvent);
        req.reply(SingleEventResponse);
      }
      if (hasOperationName(req, EventOperations.GetEventTypes)) {
        req.reply(EventsTypeResponse);
      }
    });

    cy.visit('/');
    cy.get('button')
      .contains(localizations.en.activities)
      .click({ force: true });
    cy.get('a[href="/events/"]')
      .contains(localizations.en.event)
      .click({ force: true });

    cy.location('pathname').should('eq', '/events/');
    cy.get('h2').should('be.visible');
    cy.wait(fullAliasName(EventOperations.GetEventList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          offset: 0,
          queryString: null,
          types: null,
          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(EventsListResponse);
      },
    );
  });

  it('Should display [LIST] of events', () => {
    cy.get('tr').should('have.length', 8);
  });

  it('Should support [FILTER] multiple type  value', () => {
    const eventTypes = EventsTypeResponse.data.registeredEventTypes;
    cy.get('input#tag-input').clear().type(eventTypes[0]); cy.get('[role="option"]').contains(eventTypes[0]).click();
    cy.wait(fullAliasName(EventOperations.GetEventList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          offset: 0,
          queryString: null,
          types: [eventTypes[0]],
          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(EventsListResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).to.eq('/events/');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        types: eventTypes[0],
      });
    });

    cy.get('input#tag-input').clear().type(eventTypes[1]); cy.get('[role="option"]').contains(eventTypes[1]).click();
    cy.wait(fullAliasName(EventOperations.GetEventList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          offset: 0,
          queryString: null,
          types: [eventTypes[0], eventTypes[1]],
          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(EventsListResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq('/events/');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        types: `${eventTypes[0]},${eventTypes[1]}`,
      });
    });
  });

  it('Should update data and route accordingly when [SEARCHING]', () => {
    cy.get('input[type="search"]').type('search');
    cy.wait(fullAliasName(EventOperations.GetEventList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          offset: 0,
          queryString: 'search',
          types: null,
          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(EventsListResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).to.eq('/events/');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        queryString: 'search',
      });
    });

    cy.get('input[type="search"]').type(' input');

    cy.wait(fullAliasName(EventOperations.GetEventList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          offset: 0,
          queryString: 'search input',
          types: null,
          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(EventsListResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).to.eq('/events/');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        queryString: 'search input',
      });
    });
  });

  it('Should support by [SEARCHING] and [TYPE]', () => {
    const eventTypes = EventsTypeResponse.data.registeredEventTypes;

    cy.get('input#tag-input').clear().type(eventTypes[0]); cy.get('[role="option"]').contains(eventTypes[0]).click();
    cy.wait(fullAliasName(EventOperations.GetEventList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          offset: 0,
          queryString: null,
          types: [eventTypes[0]],
          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(EventsListResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).to.eq('/events/');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        types: eventTypes[0],
      });
    });

    cy.get('input[type="search"]').type('search');

    cy.wait(fullAliasName(EventOperations.GetEventList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          offset: 0,
          queryString: 'search',
          types: [eventTypes[0]],
          sort: [
            {
              key: 'created',
              value: 'DESC',
            },
          ],
        });
        expect(response.body).to.deep.eq(EventsListResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).to.eq('/events/');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        queryString: 'search',
        types: eventTypes[0],
      });
    });
  });

  it('Navigate to [EVENT DETAIL] successfully', () => {
    const [firstEvent] = EventsListResponse.data.events;

    cy.get(`a[href="/events/?eventId=${firstEvent._id}"]`).click();
    cy.wait(fullAliasName(EventOperations.GetSingleEvent)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include({
          eventId: firstEvent._id,
        });
        expect(response.body).to.deep.eq(SingleEventResponse);
      },
    );

    cy.url().should('include', `/events/?eventId=${firstEvent._id}`);
    cy.get('textarea').should('not.exist');
    cy.contains(localizations.en.payload).click({ multiple: true });
    cy.get('textarea').should('be.visible');
    cy.contains(SingleEventResponse.data.event.type);
    cy.get('textarea').should(
      'contain.value',
      JSON.stringify(SingleEventResponse.data.event.payload, null, 2),
    );
  });
});
