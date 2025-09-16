import localizations from '../../src/i18n';
import {
  CreateFilterOptionResponse,
  CreateFilterResponse,
  FilterListResponse,
  FilterOperations,
  FilterOptionsResponse,
  FilterTypesResponse,
  RemoveFilterOptionResponse,
  RemoveFilterResponse,
  SingleFilterResponse,
  TranslatedFilterTextResponse,
  UpdateFilterResponse,
  UpdateFilterTextResponse,
} from '../mock/filter';
import { LanguageOperations, LanguagesResponse } from '../mock/language';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

const UpdateFilterOptionVariables = {
  filterOptionValue: 'option value',
  filterId: '__root_assortment',
  texts: {
    locale: 'de',
    title: 'updated option title',
    subtitle: 'updated option subtitle',
  },
};

describe('Filter', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, LanguageOperations.GetLanguagesList)) {
        aliasQuery(req, LanguageOperations.GetLanguagesList);
        req.reply(LanguagesResponse);
      }

      if (hasOperationName(req, FilterOperations.GetFiltersList)) {
        aliasQuery(req, FilterOperations.GetFiltersList);
        req.reply(FilterListResponse);
      }
      if (hasOperationName(req, FilterOperations.GetSingleFilter)) {
        aliasQuery(req, FilterOperations.GetSingleFilter);
        req.reply(SingleFilterResponse);
      }
      if (hasOperationName(req, FilterOperations.GetTranslatedFilterText)) {
        aliasQuery(req, FilterOperations.GetTranslatedFilterText);
        req.reply(TranslatedFilterTextResponse);
      }
      if (hasOperationName(req, FilterOperations.GetFilterType)) {
        aliasQuery(req, FilterOperations.GetFilterType);
        req.reply(FilterTypesResponse);
      }
      if (hasOperationName(req, FilterOperations.CreateFiler)) {
        aliasMutation(req, FilterOperations.CreateFiler);
        req.reply(CreateFilterResponse);
      }
      if (hasOperationName(req, FilterOperations.UpdateFilterText)) {
        aliasMutation(req, FilterOperations.UpdateFilterText);
        req.reply(UpdateFilterTextResponse);
      }
      if (hasOperationName(req, FilterOperations.RemoveFilter)) {
        aliasMutation(req, FilterOperations.RemoveFilter);
        req.reply(RemoveFilterResponse);
      }

      if (hasOperationName(req, FilterOperations.GetFilterOptions)) {
        aliasQuery(req, FilterOperations.GetFilterOptions);
        req.reply(FilterOptionsResponse);
      }

      if (hasOperationName(req, FilterOperations.UpdateFilter)) {
        aliasMutation(req, FilterOperations.UpdateFilter);
        req.reply(UpdateFilterResponse);
      }
      if (hasOperationName(req, FilterOperations.CreateFilterOption)) {
        aliasMutation(req, FilterOperations.CreateFilterOption);
        req.reply(CreateFilterOptionResponse);
      }
      if (hasOperationName(req, FilterOperations.RemoveFilerOption)) {
        aliasMutation(req, FilterOperations.RemoveFilerOption);
        req.reply(RemoveFilterOptionResponse);
      }
    });

    cy.visit('/');
    cy.viewport(1200, 800);
    cy.get('a[href="/filters"]')
      .contains(localizations.en.filters)
      .click({ force: true });
    cy.location('pathname').should('eq', '/filters');

    cy.wait(fullAliasName(FilterOperations.GetFiltersList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          queryString: '',
          limit: 50,
          offset: 0,
          includeInactive: true,
          sort: [],
        });
        expect(response.body).to.deep.eq(FilterListResponse);
      },
    );
    cy.get('h2').should('contain', localizations.en.filters);
  });

  context('List View', () => {
    it('Should navigate to [FILTER LIST] page successfully', () => {
      cy.get('tr').should('have.length', 4);
    });

    it('Toggling status [ACTIVE/INACTIVE] toggle should update route', () => {
      cy.get('button[role="switch"]').click();
      cy.wait(150);
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/filters');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          includeInactive: 'false',
        });
      });

      cy.wait(fullAliasName(FilterOperations.GetFiltersList)).then(
        (currentSubject) => {
          const { request } = currentSubject;
          expect(request.body.variables.includeInactive).to.eq(false);
        },
      );

      cy.get('button[role="switch"]').click();
      cy.wait(fullAliasName(FilterOperations.GetFiltersList)).then(
        (currentSubject) => {
          const { request } = currentSubject;
          expect(request.body.variables.includeInactive).to.eq(true);
        },
      );
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/filters');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          includeInactive: 'true',
        });
      });
    });

    it('Should update data and route when [SEARCHING] accordingly', () => {
      cy.get('input[type="search"]').type('search');

      cy.wait(fullAliasName(FilterOperations.GetFiltersList)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            queryString: 'search',
            limit: 50,
            offset: 0,
            includeInactive: true,
            sort: [],
          });
          expect(response.body).to.deep.eq(FilterListResponse);
        },
      );
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/filters');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          queryString: 'search',
        });
      });

      cy.get('input[type="search"]').type(' input');
      cy.wait(fullAliasName(FilterOperations.GetFiltersList)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            queryString: 'search input',
            limit: 50,
            offset: 0,
            includeInactive: true,
            sort: [],
          });
          expect(response.body).to.deep.eq(FilterListResponse);
        },
      );
      cy.location().then((current) => {
        expect(current.pathname).to.eq('/filters');
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          queryString: 'search input',
        });
      });
    });

    it('Show [DELETE FILTER FROM LIST] successfully', () => {
      const { filter } = SingleFilterResponse.data;

      cy.get('button.rounded-full.bg-white.px-1.py-1').first().click();
      cy.get('button').contains(localizations.en.delete_filter).click();
      cy.location('pathname').should('contain', '/filters');

      cy.wait(fullAliasMutationName(FilterOperations.RemoveFilter)).then(
        (currentSubject) => {
          expect(currentSubject.request.body.variables).to.deep.eq({
            filterId: filter._id,
          });
          expect(currentSubject.response.body).to.deep.eq(RemoveFilterResponse);
        },
      );
    });

    it('Should navigate to [SELECTED LOCALE] page successfully', () => {
      const [, deLocale] = LanguagesResponse.data.languages;

      cy.get('select#locale-wrapper').select(deLocale.isoCode);

      cy.wait(fullAliasName(FilterOperations.GetFiltersList)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            queryString: '',
            limit: 50,
            offset: 0,
            includeInactive: true,
            sort: [],
          });
          expect(response.body).to.deep.eq(FilterListResponse);
        },
      );

      cy.location('pathname').should('eq', '/filters');
    });
  });

  context('Detail View', () => {
    beforeEach(() => {
      cy.get(`a[href="/filters?filterId=${SingleFilterResponse.data.filter._id}"]`)
        .contains(SingleFilterResponse.data.filter.texts.title)
        .first()
        .click();

      cy.wait(fullAliasName(FilterOperations.GetSingleFilter)).then(
        (currentSubject) => {
          expect(currentSubject.request.body.variables.filterId).eq(
            SingleFilterResponse.data.filter._id,
          );
        },
      );

      cy.location('pathname').should(
        'eq',
        `/filters?filterId=${SingleFilterResponse.data.filter._id}`,
      );
      cy.get('h2').should('contain', localizations.en.filter_detail);
    });

    it('Should navigate to [FILTER DETAIL] page successfully', () => {
      cy.get('h2').should('contain', localizations.en.filter_detail);
    });

    it('Should navigate to [INITIALIZE FILTER TEXT] page successfully', () => {
      const [fistLanguage] = LanguagesResponse.data.languages;

      cy.get('select[id="locale-wrapper"]').select(fistLanguage.isoCode);

      cy.get('input[name="title"]').should(
        'have.value',
        TranslatedFilterTextResponse.data.translatedFilterTexts.find(
          (text) => text.locale === fistLanguage.isoCode,
        ).title,
      );
      cy.get('input[name="subtitle"]').should(
        'have.value',
        TranslatedFilterTextResponse.data.translatedFilterTexts.find(
          (text) => text.locale === fistLanguage.isoCode,
        ).subtitle,
      );
    });

    it('Should navigate to [RE-INITIALIZE FILTER TEXT WITH SELECTED LOCALE] page successfully', () => {
      const [, secondLanguage] = LanguagesResponse.data.languages;

      cy.get('select[id="locale-wrapper"]').select(secondLanguage.isoCode);
      cy.get('input[name="title"]').should(
        'have.value',
        TranslatedFilterTextResponse.data.translatedFilterTexts.find(
          (text) => text.locale === secondLanguage.isoCode,
        ).title,
      );
      cy.get('input[name="subtitle"]').should(
        'have.value',
        TranslatedFilterTextResponse.data.translatedFilterTexts.find(
          (text) => text.locale === secondLanguage.isoCode,
        ).subtitle,
      );
    });

    it('Should [UPDATE FILTER TEXT] successfully', () => {
      const [fistLanguage] = LanguagesResponse.data.languages;

      cy.get(`select[id="locale-wrapper"]`).select(fistLanguage.isoCode);
      cy.wait(50);
      cy.get('input[name="title"]').clear().type('Updated filter title');
      cy.get('input[name="subtitle"]').clear().type('Updated filter subtitle');

      cy.get('input[type="submit"]')
        .should('have.value', localizations.en.update_filter)
        .click();

      cy.wait(fullAliasMutationName(FilterOperations.UpdateFilterText)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
            texts: [
              {
                locale: fistLanguage.isoCode,
                title: 'Updated filter title',
                subtitle: 'Updated filter subtitle',
              },
            ],
          });
          expect(response.body).to.deep.eq(UpdateFilterTextResponse);
        },
      );
    });

    it('Should [UPDATE FILTER TEXT WITH SELECTED LOCALE] successfully', () => {
      const [, secondLanguage] = LanguagesResponse.data.languages;

      cy.get(`select[id="locale-wrapper"]`).select(secondLanguage.isoCode);
      cy.get('input[name="title"]').clear().type('Updated filter title');
      cy.get('input[name="subtitle"]').clear().type('Updated filter subtitle');

      cy.get('input[type="submit"]')
        .should('have.value', localizations.en.update_filter)
        .click();

      cy.wait(fullAliasMutationName(FilterOperations.UpdateFilterText)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
            texts: [
              {
                locale: secondLanguage.isoCode,
                title: 'Updated filter title',
                subtitle: 'Updated filter subtitle',
              },
            ],
          });
          expect(response.body).to.deep.eq(UpdateFilterTextResponse);
        },
      );
    });

    it('Show [DELETE FILTER] successfully', () => {
      const { filter } = SingleFilterResponse.data;

      cy.get('button').contains(localizations.en.delete).click();
      cy.get('button').contains(localizations.en.delete_filter).click();
      cy.location('pathname').should('contain', '/filters');

      cy.wait(fullAliasMutationName(FilterOperations.RemoveFilter)).then(
        (currentSubject) => {
          expect(currentSubject.request.body.variables).to.deep.eq({
            filterId: filter._id,
          });
          expect(currentSubject.response.body).to.deep.eq(RemoveFilterResponse);
        },
      );
    });

    it('Should navigate to [FILTER OPTIONS TAB] successfully', () => {
      cy.get('a[id="options"]').click({ multiple: true });

      cy.wait(fullAliasName(FilterOperations.GetFilterOptions)).then(
        (currentSelection) => {
          const { request, response } = currentSelection;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
          });

          expect(response.body).to.deep.eq(FilterOptionsResponse);
        },
      );
      cy.get('form li').should(
        'have.length',
        FilterOptionsResponse.data.filter.options.length,
      );

      cy.location().then((current) => {
        expect(current.pathname).to.eq(
          `/filters?filterId=${SingleFilterResponse.data.filter._id}`,
        );
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          tab: 'options',
        });
      });
    });

    it('Should [DEACTIVATE FILTER] successfully', () => {
      cy.get('div#activate').within(() => {
        cy.get('button[type="button"]').click({
          multiple: true,
        });
      });

      cy.get('li[role="option"]').contains(localizations.en.deactivate).click();

      cy.wait(fullAliasMutationName(FilterOperations.UpdateFilter)).then(
        (currentSelection) => {
          const { request, response } = currentSelection;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
            filter: { isActive: false },
          });

          expect(response.body).to.deep.eq(UpdateFilterResponse);
        },
      );
    });

    it('Should [ACTIVATE FILTER] successfully', () => {
      cy.get('div#activate').within(() => {
        cy.get('button[type="button"]').click({
          multiple: true,
        });
      });

      cy.get('li[role="option"]').contains(localizations.en.activate).click();

      cy.wait(fullAliasMutationName(FilterOperations.UpdateFilter)).then(
        (currentSelection) => {
          const { request, response } = currentSelection;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
            filter: { isActive: true },
          });

          expect(response.body).to.deep.eq(UpdateFilterResponse);
        },
      );
    });

    it('Should [ADD FILTER OPTION] successfully', () => {
      cy.get('a[id="options"]').click({ multiple: true });
      cy.location().then((current) => {
        expect(current.pathname).to.eq(
          `/filters?filterId=${SingleFilterResponse.data.filter._id}`,
        );
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          tab: 'options',
        });
      });

      cy.get('button[type="button"].fixed.top-0.right-0')
        .should('contain.text', localizations.en.add_option)
        .click({ multiple: true });

      cy.get('input[name="value"]').type('option value');
      cy.get('input[name="title"]').type('option title');
      cy.get('input[type="submit"]')
        .contains(localizations.en.add_option)
        .click();
      cy.get('div[aria-modal="modal"]').should('not.to.be', undefined);
      cy.wait(fullAliasMutationName(FilterOperations.CreateFilterOption)).then(
        (currentSelection) => {
          const { request, response } = currentSelection;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
            option: { title: 'option title', value: 'option value' },
          });
          cy.get('div[aria-modal="modal"]').should('to.be', undefined);
          expect(response.body).to.deep.eq(CreateFilterOptionResponse);
        },
      );
    });

    it('Should [SHOW ERROR FOR REQUIRED FILTER OPTION] successfully', () => {
      cy.get('a[id="options"]').click({ multiple: true });
      cy.location().should((current) => {
        expect(current.pathname).to.eq(
          `/filters?filterId=${SingleFilterResponse.data.filter._id}`,
        );
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          tab: 'options',
        });
      });

      cy.get('button[type="button"].fixed.top-0.right-0')
        .should('contain.text', localizations.en.add_option)
        .click({ multiple: true });

      cy.get('div[aria-modal="modal"]').should('not.to.be', undefined);
      cy.get('input[type="submit"]')
        .contains(localizations.en.add_option)
        .click();
      cy.get('label[for="value"]').contains(
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.value,
        ),
      );
      cy.get('label[for="title"]').contains(
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.title,
        ),
      );
      cy.get('div[aria-modal="modal"]').should('not.to.be', undefined);
      cy.get('input[type="submit"]')
        .contains(localizations.en.add_option)
        .should('be.disabled');
    });

    it('[CANCEL] should close filter option modal', () => {
      cy.get('a[id="options"]').click({ multiple: true });
      cy.location().then((current) => {
        expect(current.pathname).to.eq(
          `/filters?filterId=${SingleFilterResponse.data.filter._id}`,
        );
        expect(convertURLSearchParamToObj(current.search)).to.deep.eq({
          tab: 'options',
        });
      });

      cy.get('button[type="button"].fixed.top-0.right-0')
        .should('contain.text', localizations.en.add_option)
        .click({ multiple: true });
      cy.get('form button').contains(localizations.en.cancel).click();
      cy.get('div[aria-modal="modal"]').should('to.be', undefined);
    });

    it('Should [UPDATE FILTER Option TEXT WITH] successfully', () => {
      const [firstLanguage] = LanguagesResponse.data.languages;

      cy.get('a[id="options"]').click({ multiple: true });
      cy.get(`select[id="locale-wrapper"]`).select(firstLanguage.isoCode);
      cy.get(`div[role="button"][aria-label="${localizations.en.edit}"]`)
        .first()
        .click();
      cy.get('input[name="title"]')
        .clear()
        .type(UpdateFilterOptionVariables.texts.title);
      cy.get('input[name="subtitle"]')
        .clear()
        .type(UpdateFilterOptionVariables.texts.subtitle);

      cy.get('button[type="submit"]')
        .should('have.text', localizations.en.save)
        .click();

      cy.wait(fullAliasMutationName(FilterOperations.UpdateFilterText)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
            filterOptionValue:
              FilterOptionsResponse.data.filter.options[0].value,
            texts: [
              {
                ...UpdateFilterOptionVariables.texts,
                locale: firstLanguage.isoCode,
              },
            ],
          });
          expect(response.body).to.deep.eq(UpdateFilterTextResponse);
        },
      );
      cy.get('input[name="title"]').should('to.be', undefined);
      cy.get('input[name="subtitle"]').should('to.be', undefined);
    });

    it('Should [SHOW REQUIRED] when filter option title is empty on [UPDATE]', () => {
      const [firstLanguage] = LanguagesResponse.data.languages;

      cy.get('a[id="options"]').click({ multiple: true });
      cy.get(`select[id="locale-wrapper"]`).select(firstLanguage.isoCode);
      cy.get(`div[role="button"][aria-label="${localizations.en.edit}"]`)
        .first()
        .click();
      cy.get('input[name="title"]').clear();

      cy.get('input[name="subtitle"]')
        .type('Updated filter option subtitle')
        .clear()
        .type(UpdateFilterOptionVariables.texts.subtitle);

      cy.get('label[for="title"]').should(
        'contain.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.title,
        ),
      );
      cy.get('button[type="submit"]')
        .contains(localizations.en.save)
        .should('have.attr', 'disabled');
    });

    it('[CANCEL] should [HIDE]  [FILTER OPTION FORM]', () => {
      const [firstLanguage] = LanguagesResponse.data.languages;

      cy.get('a[id="options"]').click({ multiple: true });
      cy.get(`select[id="locale-wrapper"]`).select(firstLanguage.isoCode);
      cy.get(`div[role="button"][aria-label="${localizations.en.edit}"]`)
        .first()
        .click();

      cy.get('button[type="button"]').contains(localizations.en.cancel).click();
      cy.get('input[name="title"]').should('to.be', undefined);
      cy.get('input[name="subtitle"]').should('to.be', undefined);
    });

    it('Should [DELETE FILTER OPTION] successfully', () => {
      cy.get('a[id="options"]').click({ multiple: true });
      cy.get(`button[type="button"][aria-label="${localizations.en.delete}"]`)
        .first()
        .click();
      cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
      cy.get('button[type="button"]')
        .contains(localizations.en.delete_filter_option)
        .click();
      cy.wait(fullAliasMutationName(FilterOperations.RemoveFilerOption)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            filterId: SingleFilterResponse.data.filter._id,
            filterOptionValue:
              SingleFilterResponse.data.filter.options[0].value,
          });
          expect(response.body).to.deep.eq(RemoveFilterOptionResponse);
        },
      );
      cy.get('div[aria-modal="true"]').should('to.be', undefined);
    });

    it('Should [CANCEL DELETE FILTER OPTION] should abort deletion', () => {
      cy.get('a[id="options"]').click({ multiple: true });
      cy.get(`button[type="button"][aria-label="${localizations.en.delete}"]`)
        .first()
        .click();
      cy.get('div[aria-modal="true"]').should('not.to.be', undefined);
      cy.get('button[type="button"]').contains(localizations.en.cancel).click();

      cy.get('div[aria-modal="true"]').should('to.be', undefined);
    });
  });

  context('New Filter', () => {
    beforeEach(() => {
      cy.get('a[href="/filters/new"]').click();
      cy.location('pathname').should('eq', '/filters/new');
      cy.get('h2').should('contain', localizations.en.new_filter_header);
    });

    it('Should navigate to [NEW FILTER FORM] page successfully', () => {
      cy.get('h2').should('contain', localizations.en.new_filter_header);
    });

    it('Should [CREATE FILTER without OPTION] successfully', () => {
      const [firstFilterType] = FilterTypesResponse.data.filterTypes.options;

      cy.get('input[name="title"]').type(
        SingleFilterResponse.data.filter.texts.title,
      );
      cy.get('input[name="key"]').type(SingleFilterResponse.data.filter.key);
      cy.get('select[name="type"]').select(firstFilterType.value);
      cy.get(`button[aria-label="${localizations.en.delete}"]`).click();
      cy.get('input[type="submit"]')
        .contains(localizations.en.create_filter)
        .click();
      cy.wait(fullAliasMutationName(FilterOperations.CreateFiler)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            filter: {
              key: SingleFilterResponse.data.filter.key,
              title: SingleFilterResponse.data.filter.texts.title,
              type: firstFilterType.value,
              options: [],
            },
          });
          expect(response.body).to.deep.eq(CreateFilterResponse);
        },
      );
      cy.location('pathname').should(
        'eq',
        `/filters?filterId=${CreateFilterResponse.data.createFilter._id}`,
      );
    });

    it('Should [CREATE FILTER with 2 OPTIONS] successfully', () => {
      const [firstFilterType] = FilterTypesResponse.data.filterTypes.options;

      cy.get('input[name="title"]').type(
        SingleFilterResponse.data.filter.texts.title,
      );
      cy.get('input[name="key"]').type(SingleFilterResponse.data.filter.key);
      cy.get('select[name="type"]').select(firstFilterType.value);
      cy.get('input[name="options[0]"]').type('option 1');
      cy.get('button[type="button"]')
        .contains(localizations.en.add_option)
        .click();
      cy.get('input[name="options[1]"]').type('option 2');
      cy.get('input[type="submit"]')
        .contains(localizations.en.create_filter)
        .click();
      cy.wait(fullAliasMutationName(FilterOperations.CreateFiler)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            filter: {
              key: SingleFilterResponse.data.filter.key,
              title: SingleFilterResponse.data.filter.texts.title,
              type: firstFilterType.value,
              options: ['option 1', 'option 2'],
            },
          });
          expect(response.body).to.deep.eq(CreateFilterResponse);
        },
      );
      cy.location('pathname').should(
        'eq',
        `/filters?filterId=${CreateFilterResponse.data.createFilter._id}`,
      );
    });

    it('Should [SHOW ERROR] if option field is left empty successfully', () => {
      const [firstFilterType] = FilterTypesResponse.data.filterTypes.options;

      cy.get('input[name="title"]').type(
        SingleFilterResponse.data.filter.texts.title,
      );
      cy.get('input[name="key"]').type(SingleFilterResponse.data.filter.key);
      cy.get('select[name="type"]').select(firstFilterType.value);
      cy.get('input[type="submit"]')
        .contains(localizations.en.create_filter)
        .click();

      cy.get('label[for="options[0]"]').should(
        'contain.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.option,
        ),
      );
    });

    it('Should Display [ERROR when CREATE FILTER] required fields are missing', () => {
      const [firstFilterType] = FilterTypesResponse.data.filterTypes.options;

      cy.get('input[name="title"]').type(
        SingleFilterResponse.data.filter.texts.title,
      );
      cy.get('input[name="key"]').type(SingleFilterResponse.data.filter.key);
      cy.get('select[name="type"]').select(firstFilterType.value);
      cy.get(`button[aria-label="${localizations.en.delete}"]`).click();
      cy.get('input[type="submit"]')
        .contains(localizations.en.create_filter)
        .click();
      cy.wait(fullAliasMutationName(FilterOperations.CreateFiler)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.eq({
            filter: {
              key: SingleFilterResponse.data.filter.key,
              title: SingleFilterResponse.data.filter.texts.title,
              type: firstFilterType.value,
              options: [],
            },
          });
          expect(response.body).to.deep.eq(CreateFilterResponse);
        },
      );
      cy.location('pathname').should(
        'eq',
        `/filters?filterId=${CreateFilterResponse.data.createFilter._id}`,
      );
    });

    it('Should Display [ERROR when CREATE FILTER] required fields are missing', () => {
      cy.get('input[type="submit"]')
        .contains(localizations.en.create_filter)
        .click();

      cy.get('label[for="title"]').should(
        'contain.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.title,
        ),
      );
      cy.get('label[for="key"]').should(
        'contain.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.key,
        ),
      );
      cy.get('label[for="type"]').should(
        'contain.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.type,
        ),
      );

      // Add options required test

      cy.get('input[type="submit"]').should('be.disabled');
    });
  });
});
