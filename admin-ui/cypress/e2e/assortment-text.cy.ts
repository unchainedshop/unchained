import localizations from '../../src/i18n';
import generateUniqueId from '../../src/modules/common/utils/getUniqueId';
import { getContent } from '../../src/modules/common/utils/utils';
import {
  AssortmentListResponse,
  AssortmentOperation,
  assortmentequestVariables,
  Singleassortmentesponse,
  TranslatedAssortmentTextsResponse,
  Updateassortmentesponse,
  UpdateAssortmentTextsResponse,
} from '../mock/assortment';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import formatDateTime from '../utils/formatDateTime';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Assortment Detail Texts', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, AssortmentOperation.GetAssortmentList)) {
        aliasQuery(req, AssortmentOperation.GetAssortmentList);
        req.reply(AssortmentListResponse);
      }
      if (hasOperationName(req, AssortmentOperation.GetSingleAssortment)) {
        aliasQuery(req, AssortmentOperation.GetSingleAssortment);
        req.reply({
          data: {
            assortment: AssortmentListResponse.data.assortments.find(
              ({ _id }) => _id === req.body.variables.assortmentId,
            ),
          },
        });
      }
      if (hasOperationName(req, AssortmentOperation.GetTranslatedTexts)) {
        aliasQuery(req, AssortmentOperation.GetTranslatedTexts);
        req.reply(TranslatedAssortmentTextsResponse);
      }
      if (hasOperationName(req, AssortmentOperation.UpdateAssortment)) {
        aliasMutation(req, AssortmentOperation.UpdateAssortment);
        req.reply(Updateassortmentesponse);
      }
      if (hasOperationName(req, AssortmentOperation.UpdateAssortmentTexts)) {
        aliasMutation(req, AssortmentOperation.UpdateAssortmentTexts);
        req.reply(UpdateAssortmentTextsResponse);
      }
    });

    cy.visit('/');
    cy.get('a[href="/assortments/"]')
      .contains(localizations.en.assortments)
      .click({ force: true });

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.include(assortmentequestVariables);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );

    cy.location('pathname').should('eq', '/assortments/');
    cy.get('h2').should(
      'contain.text',
      localizations.en.assortments,
    );
  });

  context('Assortment Detail text', () => {
    beforeEach(() => {
      const { assortment } = Singleassortmentesponse.data;

      cy.get(`a[href="/assortments/?assortmentSlug=${generateUniqueId(assortment)}"]`)
        .contains(assortment?.texts?.title)
        .click();

      cy.wait(fullAliasName(AssortmentOperation.GetSingleAssortment)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.include({
            assortmentId: assortment._id,
          });
          expect(response.body).to.deep.eq(Singleassortmentesponse);
        },
      );

      cy.wait(fullAliasName(AssortmentOperation.GetTranslatedTexts)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.include({
            assortmentId: Singleassortmentesponse.data.assortment._id,
          });
          expect(response.body).to.deep.eq(TranslatedAssortmentTextsResponse);
        },
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
      cy.get('h2').should('contain.text', assortment?.texts?.title || 'Assortment');
      cy.get('select#locale-wrapper').select('en');
    });

    it('Should Navigate to [ASSORTMENT DETAIL] page successfully', () => {
      const { assortment } = Singleassortmentesponse.data;

      cy.get('input#sequence').should('have.value', assortment.sequence);
    });

    it('Should be visible [ADD TAGS] form successfully', () => {
      cy.get('button#add_tag').click();
      cy.get('form#add_tag_form').should('be.visible');
    });

    it('Should [ADD TAGS] successfully', () => {
      const { assortment } = Singleassortmentesponse.data;

      cy.get('button#add_tag').click();
      cy.get('input#tags').type('new{enter}', { force: true });
      cy.get('form#add_tag_form').within(() => {
        cy.get('input[type="submit"]').contains(localizations.en.save).click();
      });

      cy.wait(fullAliasMutationName(AssortmentOperation.UpdateAssortment)).then(
        (currentSubject) => {
          expect(currentSubject.request.body.variables).to.deep.include({
            assortment: { tags: ['new'] },
            assortmentId: assortment._id,
          });
          expect(currentSubject.response.body).to.deep.eq(
            Updateassortmentesponse,
          );
        },
      );
    });

    it('Should cancel [ADD TAGS] form successfully', () => {
      const { assortment } = Singleassortmentesponse.data;

      cy.get('button#add_tag').click();
      cy.get('[data-id="cancel_update"]')
        .contains(localizations.en.cancel)
        .click({ force: true });
      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });

    it('Should update data when [SEQUENCING] accordingly', () => {
      const { assortment } = Singleassortmentesponse.data;

      cy.get('input#sequence').clear().type('50').blur();
      cy.wait(fullAliasMutationName(AssortmentOperation.UpdateAssortment)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.include({
            assortment: {
              sequence: 50,
            },
            assortmentId: assortment._id,
          });
          expect(response.body).to.deep.eq(Updateassortmentesponse);
        },
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });

    it('Should [INITIALIZE] assortment text form', () => {
      const { assortment } = Singleassortmentesponse.data;
      const [firstText] =
        TranslatedAssortmentTextsResponse.data.translatedAssortmentTexts;

      cy.get('input#slug').should('have.value', firstText.slug);
      cy.get('input#title').should('have.value', firstText.title);
      cy.get('input#subtitle').should('have.value', firstText.subtitle);
      cy.get('input#subtitle').should('have.value', firstText.subtitle);
      cy.get('textarea#description').should(
        'have.value',
        firstText.description,
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });

    it('Should [RE-INITIALIZE WITH SELECTED LOCALE] assortment tex successfully', () => {
      const { assortment } = Singleassortmentesponse.data;
      const [, secondText] =
        TranslatedAssortmentTextsResponse.data.translatedAssortmentTexts;

      cy.get('select#locale-wrapper').select('de');
      cy.get('input#slug').should('have.value', secondText.slug);
      cy.get('input#title').should('have.value', secondText.title);
      cy.get('input#subtitle').should('have.value', secondText.subtitle);
      cy.get('textarea#description').should(
        'have.value',
        secondText.description,
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });

    it('Should [UPDATE] assortment text form successfully', () => {
      const { assortment } = Singleassortmentesponse.data;
      const [firstText] =
        TranslatedAssortmentTextsResponse.data.translatedAssortmentTexts;

      cy.get('input#title').clear().type(firstText.title);
      cy.get('input#subtitle').clear().type(firstText.subtitle);
      cy.get('input[type="submit"]').contains(localizations.en.save).click();

      cy.wait(
        fullAliasMutationName(AssortmentOperation.UpdateAssortmentTexts),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect({
          ...request.body.variables,
          texts: [{ ...request.body.variables.texts[0], description: null }],
        }).to.deep.eq({
          texts: [
            {
              locale: firstText.locale,
              slug: firstText.slug,
              title: firstText.title,
              subtitle: firstText.subtitle,
              description: null,
            },
          ],
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(UpdateAssortmentTextsResponse);
      });

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });

    it('Should [UPDATE WITH SELECTED LOCALE] assortment text form successfully', () => {
      const { assortment } = Singleassortmentesponse.data;
      const [, secondText] =
        TranslatedAssortmentTextsResponse.data.translatedAssortmentTexts;

      cy.get('select#locale-wrapper').select('de');
      cy.get('input#title').clear().type(secondText.title);
      cy.get('input#subtitle').clear().type(secondText.subtitle);
      cy.get('input[type="submit"]').contains(localizations.en.save).click();

      cy.wait(
        fullAliasMutationName(AssortmentOperation.UpdateAssortmentTexts),
      ).then((currentSubject) => {
        const { request, response } = currentSubject;
        expect({
          ...request.body.variables,
          texts: [{ ...request.body.variables.texts[0], description: null }],
        }).to.deep.eq({
          texts: [
            {
              locale: secondText.locale,
              slug: secondText.slug,
              title: secondText.title,
              subtitle: secondText.subtitle,
              description: null,
            },
          ],
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(UpdateAssortmentTextsResponse);
      });

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });

    it('Show [ERROR] when required fields are not provided in update assortment text', () => {
      cy.get('input#slug').clear();
      cy.get('input#title').clear().blur();

      cy.get('label[for="slug"]').should(
        'contain.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.slug,
        ),
      );
      cy.get('label[for="title"]').should(
        'contain.text',
        replaceIntlPlaceholder(
          localizations.en.error_required,
          localizations.en.title,
        ),
      );

      cy.get('input[type="submit"]')
        .contains(localizations.en.save)
        .should('be.disabled');
    });
  });

  context('Assortment Detail buttons', () => {
    it('Should [MAKE ROOT] successfully', () => {
      const assortment = AssortmentListResponse.data.assortments.find(
        ({ _id }) => _id === 'not-root',
      );

      cy.get(`a[href="/assortments/?assortmentSlug=${generateUniqueId(assortment)}"]`)
        .contains(assortment?.texts?.title)
        .click();

      cy.wait(fullAliasName(AssortmentOperation.GetSingleAssortment)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.include({
            assortmentId: assortment._id,
          });
          expect(response.body).to.deep.eq({
            data: {
              assortment,
            },
          });
        },
      );

      cy.wait(fullAliasName(AssortmentOperation.GetTranslatedTexts)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.include({
            assortmentId: assortment._id,
          });
          expect(response.body).to.deep.eq(TranslatedAssortmentTextsResponse);
        },
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
      cy.get('h2').should('contain.text', assortment?.texts?.title || 'Assortment');
      cy.get('select#locale-wrapper').select('en');

      cy.get('div#leaf button').first().scrollIntoView().click();
      cy.get('[role="option"]').contains(localizations.en.make_root).click();

      cy.wait(fullAliasMutationName(AssortmentOperation.UpdateAssortment)).then(
        (currentSubject) => {
          expect(currentSubject.request.body.variables).to.deep.include({
            assortment: { isRoot: true },
            assortmentId: assortment._id,
          });
          expect(currentSubject.response.body).to.deep.eq(
            Updateassortmentesponse,
          );
        },
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });

    it('Should [ACTIVATE] successfully', () => {
      const assortment = AssortmentListResponse.data.assortments.find(
        ({ _id }) => _id === 'not-active',
      );

      cy.get(`a[href="/assortments/?assortmentSlug=${generateUniqueId(assortment)}"]`)
        .contains(assortment?.texts?.title)
        .click();

      cy.wait(fullAliasName(AssortmentOperation.GetSingleAssortment)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.include({
            assortmentId: assortment._id,
          });
          expect(response.body).to.deep.eq({
            data: {
              assortment,
            },
          });
        },
      );

      cy.wait(fullAliasName(AssortmentOperation.GetTranslatedTexts)).then(
        (currentSubject) => {
          const { request, response } = currentSubject;
          expect(request.body.variables).to.deep.include({
            assortmentId: assortment._id,
          });
          expect(response.body).to.deep.eq(TranslatedAssortmentTextsResponse);
        },
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
      cy.get('h2').should('contain.text', assortment?.texts?.title || 'Assortment');
      cy.get('select#locale-wrapper').select('en');

      cy.get('div#in-active button').first().scrollIntoView().click();
      cy.get('[role="option"]').contains(localizations.en.activate).click();

      cy.wait(fullAliasMutationName(AssortmentOperation.UpdateAssortment)).then(
        (currentSubject) => {
          expect(currentSubject.request.body.variables).to.deep.include({
            assortment: { isActive: true },
            assortmentId: assortment._id,
          });
          expect(currentSubject.response.body).to.deep.eq(
            Updateassortmentesponse,
          );
        },
      );

      cy.url().should('include', `/assortments/?assortmentSlug=${generateUniqueId(assortment)}`,
      );
    });
  });
});
