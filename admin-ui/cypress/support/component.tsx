// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import '../../styles/globals.css';
import { MockedProvider } from '@apollo/client/testing/react';
import Router from 'next/router';
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/react';
import { IntlProvider } from 'react-intl';

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Example use:
// cy.mount(<MyComponent />)

Cypress.Commands.add('mount', (component, options: any) => {
  // Mock a `Router`, enable asserting against function calls using `cy.stub`: ( cy.get('@router:back').should(...) )
  const router = {
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    basePath: '',
    back: cy.stub().as('router:back'),
    forward: cy.stub().as('router:forward'),
    push: cy.stub().as('router:push'),
    reload: cy.stub().as('router:reload'),
    replace: cy.stub().as('router:replace'),
    isReady: true,
    ...(options?.router || {}),
  };

  cy.stub(Router, 'useRouter' as any).returns(router);

  return mount(
    <MockedProvider>
      <IntlProvider messages={{}} locale="en">
        {component as any}
      </IntlProvider>
    </MockedProvider>,
    options,
  );
});
