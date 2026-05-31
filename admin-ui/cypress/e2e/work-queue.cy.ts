import localizations from '../../src/i18n';
import {
  AddWorkResponse,
  AllocatedWorkResponse,
  SuccessResponse,
  WorkOperations,
  WorkQueueResponse,
  WorkTypesResponse,
} from '../mock/work';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

const ActiveWorkTypesResponse = {
  data: {
    activeWorkTypes: [
      'EMAIL',
      'MARK_ORDER_DELIVERED',
      'MESSAGE',
      'ORDERLY_KITCHEN_CLOSE',
      'SMS',
      'BULK_IMPORT',
      'ZOMBIE_KILLER',
    ],
  },
};

describe('WorkQueue', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, WorkOperations.GetWorkQueue)) {
        aliasQuery(req, WorkOperations.GetWorkQueue);
        req.reply(WorkQueueResponse);
      }
      if (hasOperationName(req, WorkOperations.GetWork)) {
        aliasQuery(req, WorkOperations.GetWork);
        req.reply(AllocatedWorkResponse);
      }
      if (hasOperationName(req, WorkOperations.GetWorkTypes)) {
        aliasQuery(req, WorkOperations.GetWorkTypes);
        req.reply(WorkTypesResponse);
      }
      if (hasOperationName(req, 'ActiveWorkTypes')) {
        aliasQuery(req, 'ActiveWorkTypes');
        req.reply(ActiveWorkTypesResponse);
      }
      if (hasOperationName(req, WorkOperations.AddWork)) {
        aliasMutation(req, WorkOperations.AddWork);
        req.reply(AddWorkResponse);
      }
    });

    cy.visit('/works');
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { response } = currentSubject;
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location('pathname').should('eq', '/works/');
  });

  it('Should return [WORK QUEUE LIST] successfully', () => {
    cy.location('pathname').should('eq', '/works/');
    cy.get('tr').should('have.length.gte', 2);
  });

  it('Should NOT be checked initially', () => {
    cy.location('pathname').should('eq', '/works/');
    cy.get(`input[type="checkbox"][value="ALLOCATED"]`).should(
      'not.be.checked',
    );
    cy.get(`input[type="checkbox"][value="SUCCESS"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="NEW"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="FAILED"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="DELETED"]`).should('not.be.checked');
  });

  it('Should [FILTER] with selected [STATUS] only [ALLOCATED, DELETED]', () => {
    cy.location('pathname').should('eq', '/works/');
    cy.get(`input[type="checkbox"][value="ALLOCATED"]`).click();

    cy.location().should((current) => {
      expect(convertURLSearchParamToObj(current.search)).to.deep.include({
        status: 'ALLOCATED',
      });
    });

    // Wait for a WorkQueue request that includes the status filter
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        // The status may appear in a subsequent polled request
        if (request.body.variables.status) {
          expect(request.body.variables.status).to.deep.include.members(['ALLOCATED']);
        }
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );

    cy.get(`input[type="checkbox"][value="ALLOCATED"]`).should('be.checked');
    cy.get(`input[type="checkbox"][value="SUCCESS"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="NEW"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="FAILED"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="DELETED"]`).click();

    cy.location().should((current) => {
      expect(convertURLSearchParamToObj(current.search)).to.deep.include({
        status: 'ALLOCATED,DELETED',
      });
    });

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        if (request.body.variables.status) {
          expect(request.body.variables.status).to.deep.include.members(['ALLOCATED', 'DELETED']);
        }
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
  });

  it('Should [FILTER] with selected [TYPE] only', () => {
    cy.location('pathname').should('eq', '/works/');
    cy.get('select[id="tag-input"]').then(($select) => {
      const firstOption = $select.find('option').not(':disabled').first().val() as string;
      if (firstOption) {
        cy.get('select[id="tag-input"]').select(firstOption);
        cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
          (currentSubject) => {
            const { request, response } = currentSubject;
            expect(request.body.variables.types).to.include(firstOption);
            expect(response.body).to.deep.eq(WorkQueueResponse);
          },
        );
        cy.location().then((current) => {
          expect(convertURLSearchParamToObj(current.search)).to.have.property('types');
        });
      }
    });
  });

  it('Should [SEARCH] with [QUERY STRING] only', () => {
    cy.location('pathname').should('eq', '/works/');
  });

  it('Should [FILTER] with multiple fields [TYPE & STATUS] only', () => {
    cy.location('pathname').should('eq', '/works/');
    cy.get('select[id="tag-input"]').then(($select) => {
      const firstOption = $select.find('option').not(':disabled').first().val() as string;
      if (firstOption) {
        cy.get('select[id="tag-input"]').select(firstOption);
        cy.wait(fullAliasName(WorkOperations.GetWorkQueue));

        cy.get(`input[type="checkbox"][value="ALLOCATED"]`).click();

        cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
          (currentSubject) => {
            const { request, response } = currentSubject;
            expect(request.body.variables.status).to.deep.include.members(['ALLOCATED']);
            expect(response.body).to.deep.eq(WorkQueueResponse);
          },
        );
        cy.location().then((current) => {
          const params = convertURLSearchParamToObj(current.search);
          expect(params).to.have.property('types');
          expect(params).to.have.property('status', 'ALLOCATED');
        });
      }
    });
  });

  it('Should Navigate to [WORK DETAIL] page successfully', () => {
    cy.location('pathname').should('eq', '/works/');
    cy.get(`a[href="/works/?workerId=${AllocatedWorkResponse.data.work._id}"]`)
      .first()
      .click();

    cy.wait(fullAliasName(WorkOperations.GetWork)).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.include({
        workId: AllocatedWorkResponse.data.work._id,
      });
      expect(response.body).to.deep.eq(AllocatedWorkResponse);
    });

    cy.url().should('include', `/works/?workerId=${AllocatedWorkResponse.data.work._id}`,
    );

    cy.get('h2').should('contain', localizations.en.work_detail);
  });

  it('Should Navigate to [WORK DETAIL] page successfully', () => {
    cy.location('pathname').should('eq', '/works/');
    cy.get(`a[href="/works/?workerId=${AllocatedWorkResponse.data.work._id}"]`)
      .first()
      .click();

    cy.wait(fullAliasName(WorkOperations.GetWork)).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.include({
        workId: AllocatedWorkResponse.data.work._id,
      });
      expect(response.body).to.deep.eq(AllocatedWorkResponse);
    });

    cy.url().should('include', `/works/?workerId=${AllocatedWorkResponse.data.work._id}`,
    );
    cy.get('h2').should('contain', localizations.en.work_detail);
  });

  it('Should navigate [WORK MANAGEMENT] page successfully', () => {
    cy.visit('/works/management');

    cy.get('h2').should(
      'contain.text',
      localizations.en.work_management_setting_list_header,
    );
  });

  it('Should [ADD WORK] successfully', () => {
    cy.viewport(1200, 800);
    const firstType = { value: ActiveWorkTypesResponse.data.activeWorkTypes[0] };
    cy.visit('/works/management');

    cy.get('h2').should(
      'contain.text',
      localizations.en.work_management_setting_list_header,
    );

    cy.get('a[id="add_work"]').click();

    cy.get('select[name="type"]').select(firstType.value);
    cy.get('input[name="priority"]').type('1');
    cy.get('input[name="retries"]').type('1');
    cy.get('input[name="originalWorkId"]').type('allocation-test');

    cy.get('input[name="scheduled"]').clear().type('1990-05-13');
    cy.get('textarea[name="input"]')
      .clear()
      .type(JSON.stringify(SuccessResponse.data.work.input, null, 2));
    cy.get('input[name="scheduled"]').clear().type('1990-05-13');
    cy.get('textarea[name="input"]').click();
    cy.get(`input[type="submit"][aria-label="${localizations.en.add_work}"]`)
      .contains(localizations.en.add_work)
      .click();

    cy.wait(fullAliasMutationName(WorkOperations.AddWork)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables.type).to.eq(firstType.value);
        expect(request.body.variables.priority).to.eq(1);
        expect(request.body.variables.retries).to.eq(1);
        expect(request.body.variables.originalWorkId).to.eq('allocation-test');
        // eslint-disable-next-line no-unused-expressions
        expect(request.body.variables.scheduled).not.to.be.null;
        expect(response.body).to.deep.eq(AddWorkResponse);
      },
    );

    cy.url().should('include', `/works/?workerId=${AddWorkResponse.data.addWork._id}`,
    );
  });

  it('Should show[ERROR] when required fields are missing', () => {
    cy.viewport(1200, 800);

    cy.visit('/works/management');

    cy.get('h2').should(
      'contain.text',
      localizations.en.work_management_setting_list_header,
    );

    cy.get('a[id="add_work"]').click();

    cy.get(`input[type="submit"][aria-label="${localizations.en.add_work}"]`)
      .contains(localizations.en.add_work)
      .click();
    cy.get('label[for="type"]').should(
      'contain.text',
      replaceIntlPlaceholder(
        localizations.en.error_required,
        localizations.en.type,
      ),
    );
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.add_work}"]`,
    ).should('be.disabled');
  });

  it('Should show [ERROR] when input field provided invalid JSON', () => {
    cy.viewport(1200, 800);
    const firstType = { value: ActiveWorkTypesResponse.data.activeWorkTypes[0] };
    cy.visit('/works/management');

    cy.get('h2').should(
      'contain.text',
      localizations.en.work_management_setting_list_header,
    );

    cy.get('a[id="add_work"]').click();

    cy.get('select[name="type"]').select(firstType.value);
    cy.get('input[name="priority"]').type('1');
    cy.get('input[name="retries"]').type('1');
    cy.get('input[name="originalWorkId"]').type('allocation-test');

    cy.get('input[name="scheduled"]').clear().type('1990-05-13');
    cy.get('textarea[name="input"]').clear().type('invalid}');
    cy.get('input[name="scheduled"]').clear().type('1990-05-13');
    cy.get('textarea[name="input"]');
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.add_work}"]`,
    ).should('be.disabled');
  });
});
