import localizations from '../../src/i18n';
import generateUniqueId from '../../src/modules/common/utils/getUniqueId';
import { getContent } from '../../src/modules/common/utils/utils';
import {
  AssortmentListResponse,
  AssortmentMediaResponse,
  AssortmentOperation,
  assortmentequestVariables,
  RemoveAssortmentMediaResponse,
  Singleassortmentesponse,
  TranslatedAssortmentTextsResponse,
  TranslatedAssortmentMediaTextsResponse,
  UpdateAssortmentMediaTextsResponse,
} from '../mock/assortment';
import { aliasMutation, fullAliasMutationName } from '../utils/aliasMutation';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import convertURLSearchParamToObj from '../utils/convertURLSearchParamToObj';
import hasOperationName from '../utils/hasOperationName';
import replaceIntlPlaceholder from '../utils/replaceIntlPlaceholder';

describe('Assortment Detail Media', () => {
  const { assortment } = Singleassortmentesponse.data;
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, AssortmentOperation.GetAssortmentList)) {
        aliasQuery(req, AssortmentOperation.GetAssortmentList);
        req.reply(AssortmentListResponse);
      }
      if (hasOperationName(req, AssortmentOperation.GetSingleAssortment)) {
        aliasQuery(req, AssortmentOperation.GetSingleAssortment);
        req.reply(Singleassortmentesponse);
      }
      if (hasOperationName(req, AssortmentOperation.GetTranslatedTexts)) {
        aliasQuery(req, AssortmentOperation.GetTranslatedTexts);
        req.reply(TranslatedAssortmentTextsResponse);
      }
      if (hasOperationName(req, AssortmentOperation.AssortmentMedia)) {
        aliasQuery(req, AssortmentOperation.AssortmentMedia);
        req.reply(AssortmentMediaResponse);
      }
      if (hasOperationName(req, AssortmentOperation.GetMediaTexts)) {
        aliasQuery(req, AssortmentOperation.GetMediaTexts);
        req.reply(TranslatedAssortmentMediaTextsResponse);
      }
      if (hasOperationName(req, AssortmentOperation.RemoveMedia)) {
        aliasMutation(req, AssortmentOperation.RemoveMedia);
        req.reply(RemoveAssortmentMediaResponse);
      }
      if (hasOperationName(req, AssortmentOperation.UpdateMediaTexts)) {
        aliasMutation(req, AssortmentOperation.UpdateMediaTexts);
        req.reply(UpdateAssortmentMediaTextsResponse);
      }
    });

    cy.viewport(1200, 800);
    cy.visit('/');
    cy.get('a[href="/assortments"]')
      .contains(localizations.en.assortments)
      .click({ force: true });

    cy.wait(fullAliasName(AssortmentOperation.GetAssortmentList)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq(assortmentequestVariables);
        expect(response.body).to.deep.eq(AssortmentListResponse);
      },
    );

    cy.location('pathname').should('eq', '/assortments');
    cy.get('h2').should(
      'contain.text',
      localizations.en.assortments,
    );

    cy.get(`a[href="/assortments?assortmentSlug=${generateUniqueId(assortment)}"]`)
      .contains(assortment?.texts?.title)
      .click();

    cy.wait(fullAliasName(AssortmentOperation.GetSingleAssortment)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(Singleassortmentesponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.GetTranslatedTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: Singleassortmentesponse.data.assortment._id,
        });
        expect(response.body).to.deep.eq(TranslatedAssortmentTextsResponse);
      },
    );

    cy.location('pathname').should(
      'eq',
      `/assortments?assortmentSlug=${generateUniqueId(assortment)}`,
    );
    cy.get('h2').within(() => {
      cy.get('span').should(
        'contain.text',
        getContent(
          replaceIntlPlaceholder(
            localizations.en.assortment,
            assortment._id,
            'id',
          ),
        ),
      );
    });

    cy.get('a#media').contains(localizations.en.media).click();

    cy.wait(fullAliasName(AssortmentOperation.AssortmentMedia)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentMediaResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.GetMediaTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentMediaId:
            AssortmentMediaResponse.data.assortment.media[0]._id,
        });
        expect(response.body).to.deep.eq(
          TranslatedAssortmentMediaTextsResponse,
        );
      },
    );

    cy.get('select#locale-wrapper').select('en');
  });

  afterEach(() => {
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq(
        `/assortments?assortmentSlug=${generateUniqueId(assortment)}`,
      );
      expect(convertURLSearchParamToObj(loc.search)).to.deep.eq({
        tab: 'media',
      });
    });
  });

  it('Should Navigate to [ASSORTMENT DETAIL MEDIA] tab successfully', () => {
    cy.get('div#media_uploader').should('be.visible');
    cy.get('button[aria-describedBy="assortment-media"]').should(
      'have.length',
      1,
    );
  });

  it('Should [DELETE] media successfully', () => {
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_continue')
      .contains(localizations.en.delete_assortment_media)
      .click();

    cy.wait(fullAliasMutationName(AssortmentOperation.RemoveMedia)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentMediaId:
            AssortmentMediaResponse.data.assortment.media[0]._id,
        });
        expect(response.body).to.deep.eq(RemoveAssortmentMediaResponse);
      },
    );

    cy.wait(fullAliasName(AssortmentOperation.AssortmentMedia)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentId: assortment._id,
        });
        expect(response.body).to.deep.eq(AssortmentMediaResponse);
      },
    );
  });

  it('Should [CANCEL] delete media successfully', () => {
    cy.get('button[type="button"]#delete_button').first().click();
    cy.get('button[type="button"]#danger_cancel')
      .contains(localizations.en.cancel)
      .click();
  });

  it('Should [INITIALIZE] assortment text form', () => {
    const [firstText] =
      TranslatedAssortmentMediaTextsResponse.data
        .translatedAssortmentMediaTexts;

    cy.get('button#edit').first().click();
    cy.get('input#title').should('have.value', firstText.title);
    cy.get('input#subtitle').should('have.value', firstText.subtitle);
  });

  it('Should [RE-INITIALIZE WITH SELECTED LOCALE] assortment tex successfully', () => {
    const [, secondTexts] =
      TranslatedAssortmentMediaTextsResponse.data
        .translatedAssortmentMediaTexts;

    cy.get('select#locale-wrapper').select('de');
    cy.get('button#edit').first().click();
    cy.get('input#title').should('have.value', secondTexts.title);
    cy.get('input#subtitle').should('have.value', secondTexts.subtitle);
  });

  it('Should [UPDATE] media texts successfully', () => {
    const [firstText] =
      TranslatedAssortmentMediaTextsResponse.data
        .translatedAssortmentMediaTexts;

    cy.get('button#edit').first().click();
    cy.get('input#title').clear().type(firstText.title);
    cy.get('input#subtitle').clear().type(firstText.subtitle);

    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.wait(fullAliasMutationName(AssortmentOperation.UpdateMediaTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentMediaId:
            AssortmentMediaResponse.data.assortment.media[0]._id,
          texts: [
            {
              locale: firstText.locale,
              title: firstText.title,
              subtitle: firstText.subtitle,
            },
          ],
        });
        expect(response.body).to.deep.eq(UpdateAssortmentMediaTextsResponse);
      },
    );
  });

  it('Should [UPDATE WITH SELECTED LOCALE] media texts successfully', () => {
    const [, secondTexts] =
      TranslatedAssortmentMediaTextsResponse.data
        .translatedAssortmentMediaTexts;

    cy.get('select#locale-wrapper').select('de');
    cy.get('button#edit').first().click();
    cy.get('input#title').clear().type(secondTexts.title);
    cy.get('input#subtitle').clear().type(secondTexts.subtitle);

    cy.get('input[type="submit"]').contains(localizations.en.save).click();

    cy.wait(fullAliasMutationName(AssortmentOperation.UpdateMediaTexts)).then(
      (currentSubject) => {
        const { request, response } = currentSubject;
        expect(request.body.variables).to.deep.eq({
          assortmentMediaId:
            AssortmentMediaResponse.data.assortment.media[0]._id,
          texts: [
            {
              locale: secondTexts.locale,
              title: secondTexts.title,
              subtitle: secondTexts.subtitle,
            },
          ],
        });
        expect(response.body).to.deep.eq(UpdateAssortmentMediaTextsResponse);
      },
    );
  });

  it('Should [CANCEL] in media texts update form', () => {
    cy.get('button#edit').first().click();
    cy.get('input#title').clear().type('title');
    cy.get('button[type="button"][data-id="cancel_update"]')
      .contains(localizations.en.cancel)
      .click();
  });
});
