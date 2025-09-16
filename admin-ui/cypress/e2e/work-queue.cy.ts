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
// add search test
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
      if (hasOperationName(req, WorkOperations.AddWork)) {
        aliasMutation(req, WorkOperations.AddWork);
        req.reply(AddWorkResponse);
      }
    });

    cy.visit('/');
    cy.get('button')
      .contains(localizations.en.activities)
      .click({ force: true });
    cy.get('a[href="/works"]')
      .contains(localizations.en.work_queue)
      .click({ force: true });

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
  });

  it('Should return [WORK QUEUE LIST] successfully', () => {
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location('pathname').should('eq', '/works');
    cy.get('h2').should('contain', localizations.en.work_queue_header);
    cy.get('tr').should('have.length', 20);
  });

  it('Should NOT be checked initially', () => {
    cy.location('pathname').should('eq', '/works');
    cy.get('h2').should('contain', localizations.en.work_queue_header);
    cy.get(`input[type="checkbox"][value="ALLOCATED"]`).should(
      'not.be.checked',
    );
    cy.get(`input[type="checkbox"][value="SUCCESS"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="NEW"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="FAILED"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="DELETED"]`).should('not.be.checked');
  });

  it('Should [FILTER] with selected [STATUS] only [ALLOCATED, DELETED]', () => {
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location('pathname').should('eq', '/works');
    cy.get('h2').should('contain', localizations.en.work_queue_header);
    cy.get(`input[type="checkbox"][value="ALLOCATED"]`).click();
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          status: ['ALLOCATED'],
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).eq('/works');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        status: 'ALLOCATED',
      });
    });
    cy.get(`input[type="checkbox"][value="ALLOCATED"]`).should('be.checked');
    cy.get(`input[type="checkbox"][value="SUCCESS"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="NEW"]`).should('not.be.checked');
    cy.get(`input[type="checkbox"][value="FAILED"]`).should('not.be.checked');
    cy.location('pathname').should('eq', '/works');
    cy.get(`input[type="checkbox"][value="DELETED"]`).click();

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          status: ['ALLOCATED', 'DELETED'],
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).eq('/works');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        status: 'ALLOCATED,DELETED',
      });
    });
  });

  it('Should [FILTER] with selected [TYPE] only', () => {
    const { activeWorkTypes } = WorkQueueResponse.data;

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location('pathname').should('eq', '/works');
    cy.get('h2').should('contain', localizations.en.work_queue_header);
    cy.get('select[id="tag-input"]').select(activeWorkTypes[0]);
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          types: [activeWorkTypes[0]],
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          types: [activeWorkTypes[0]],
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).eq('/works');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        types: activeWorkTypes[0],
      });
    });

    cy.get('select[id="tag-input"]').select(activeWorkTypes[1]);

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          types: [activeWorkTypes[0], activeWorkTypes[1]],
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).eq('/works');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        types: `${activeWorkTypes[0]},${activeWorkTypes[1]}`,
      });
    });
  });

  it('Should [SEARCH] with [QUERY STRING] only', () => {
    cy.location('pathname').should('eq', '/works');
    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
  });

  it('Should [FILTER] with multiple fields [TYPE & STATUS] only', () => {
    const { activeWorkTypes } = WorkQueueResponse.data;

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location('pathname').should('eq', '/works');
    cy.get('h2').should('contain', localizations.en.work_queue_header);
    cy.get('select[id="tag-input"]').select(activeWorkTypes[0]);

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          types: [activeWorkTypes[0]],
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );

    cy.location().then((current) => {
      expect(current.pathname).eq('/works');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        types: activeWorkTypes[0],
      });
    });

    cy.get(`input[type="checkbox"][value="ALLOCATED"]`).click();

    cy.wait(150);

    cy.wait(fullAliasName(WorkOperations.GetWorkQueue)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          offset: 0,
          limit: 50,
          created: {},
          types: [activeWorkTypes[0]],
          status: ['ALLOCATED'],
          sort: [{ key: 'scheduled', value: 'DESC' }],
        });
        expect(response.body).to.deep.eq(WorkQueueResponse);
      },
    );
    cy.location().then((current) => {
      expect(current.pathname).eq('/works');
      expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
        types: activeWorkTypes[0],
        status: 'ALLOCATED',
      });
    });
  });

  it('Should Navigate to [WORK DETAIL] page successfully', () => {
    cy.location('pathname').should('eq', '/works');
    cy.get('h2').should('contain', localizations.en.work_queue_header);
    cy.get(`a[href="/works?workerId=${AllocatedWorkResponse.data.work._id}"]`)
      .first()
      .click();

    cy.wait(fullAliasName(WorkOperations.GetWork)).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        workId: AllocatedWorkResponse.data.work._id,
      });
      expect(response.body).to.deep.eq(AllocatedWorkResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/works?workerId=${AllocatedWorkResponse.data.work._id}`,
    );

    cy.get('h2').should('contain', localizations.en.work_detail);
  });

  it('Should Navigate to [WORK DETAIL] page successfully', () => {
    cy.location('pathname').should('eq', '/works');
    cy.get('h2').should('contain', localizations.en.work_queue_header);
    cy.get(`a[href="/works?workerId=${AllocatedWorkResponse.data.work._id}"]`)
      .first()
      .click();

    cy.wait(fullAliasName(WorkOperations.GetWork)).then((currentSubject) => {
      const { request, response } = currentSubject;
      expect(request.body.variables).to.deep.eq({
        workId: AllocatedWorkResponse.data.work._id,
      });
      expect(response.body).to.deep.eq(AllocatedWorkResponse);
    });

    cy.location('pathname').should(
      'eq',
      `/works?workerId=${AllocatedWorkResponse.data.work._id}`,
    );
    cy.get('h2').should('contain', localizations.en.work_detail);
  });

  it('Should navigate [WORK MANAGEMENT] page successfully', () => {
    cy.get('a[href="/works/management"]')
      .contains(localizations.en.manage)
      .click();

    cy.get('h2').should(
      'contain.text',
      localizations.en.work_management_setting_list_header,
    );
  });

  it('Should [ADD WORK] successfully', () => {
    cy.viewport(1200, 800);
    const [firstType] = WorkTypesResponse.data.registeredWorkTypes.options;
    cy.get('a[href="/works/management"]')
      .contains(localizations.en.manage)
      .click();

    cy.get('h2').should(
      'contain.text',
      localizations.en.work_management_setting_list_header,
    );

    cy.get('a[id="add_work"]').click();

    cy.get('select[name="type"]').select(firstType.value);
    cy.get('input[name="priority"]').type('1');
    cy.get('input[name="retries"]').type('1');
    cy.get('input[name="originalWorkId"]').type('allocation-test');

    cy.get('input[name="scheduled"]').focus();
    cy.get('select.react-datepicker__month-select').select(4);
    cy.get('select.react-datepicker__year-select').select('1990');
    cy.get('div.react-datepicker__day.react-datepicker__day--013').click();
    cy.get('textarea[name="input"]')
      .clear()
      .type(JSON.stringify(SuccessResponse.data.work.input, null, 2));
    cy.get('textarea[name="input"]').blur();
    cy.get(`input[type="submit"][aria-label="${localizations.en.add_work}"]`)
      .contains(localizations.en.add_work)
      .click();

    cy.wait(fullAliasMutationName(WorkOperations.AddWork)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect({ ...request.body.variables, scheduled: null }).to.deep.eq({
          type: firstType.value,
          priority: 1,
          retries: 1,
          scheduled: null,
          originalWorkId: 'allocation-test',
          input: SuccessResponse.data.work.input,
        });
        // eslint-disable-next-line no-unused-expressions
        expect(request.body.variables.scheduled).not.to.be.null;
        expect(response.body).to.deep.eq(AddWorkResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/works?workerId=${AddWorkResponse.data.addWork._id}`,
    );
  });

  it('Should show[ERROR] when required fields are missing', () => {
    cy.viewport(1200, 800);

    cy.get('a[href="/works/management"]')
      .contains(localizations.en.manage)
      .click();

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
    const [firstType] = WorkTypesResponse.data.registeredWorkTypes.options;
    cy.get('a[href="/works/management"]')
      .contains(localizations.en.manage)
      .click();

    cy.get('h2').should(
      'contain.text',
      localizations.en.work_management_setting_list_header,
    );

    cy.get('a[id="add_work"]').click();

    cy.get('select[name="type"]').select(firstType.value);
    cy.get('input[name="priority"]').type('1');
    cy.get('input[name="retries"]').type('1');
    cy.get('input[name="originalWorkId"]').type('allocation-test');

    cy.get('input[name="scheduled"]').focus();
    cy.get('select.react-datepicker__month-select').select(4);
    cy.get('select.react-datepicker__year-select').select('1990');
    cy.get('div.react-datepicker__day.react-datepicker__day--013').click();
    cy.get('textarea[name="input"]').clear().type('invalid}');
    cy.get('textarea[name="input"]');
    cy.get(
      `input[type="submit"][aria-label="${localizations.en.add_work}"]`,
    ).should('be.disabled');
  });
});
