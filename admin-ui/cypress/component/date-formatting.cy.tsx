import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import AppContext from '../../src/modules/common/components/AppContext.tsx';
import useFormatDateTime, {
  resolveDateTimeLocale,
} from '../../src/modules/common/utils/useFormatDateTime.ts';

const orderDate = '2026-09-07T08:58:00Z';
const orderOptions: Intl.DateTimeFormatOptions = {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'UTC',
};

const DateDisplay = ({ dates, options }) => {
  const { formatDateTime, locale } = useFormatDateTime();
  return (
    <div>
      <output data-cy="date-locale">{locale}</output>
      {dates.map((date, index) => (
        <output key={index} data-cy={`date-${index}`}>
          {formatDateTime(date, options)}
        </output>
      ))}
    </div>
  );
};

const mountDates = ({
  locale = 'en',
  country = 'CH',
  selectedLocale = undefined as string | undefined,
  dates = [orderDate] as (string | number | Date | null | undefined)[],
  options = orderOptions,
} = {}) => {
  const cache = new InMemoryCache().restore({
    ROOT_QUERY: {
      __typename: 'Query',
      shopInfo: {
        _id: 'shop',
        version: 'test',
        language: null,
        country: country
          ? {
              _id: country,
              isoCode: country,
              flagEmoji: '',
              name: country,
              defaultCurrency: null,
            }
          : null,
        adminUiConfig: null,
      },
    },
  });
  const client = new ApolloClient({ cache, link: ApolloLink.empty() });
  const Harness = () => {
    const [uiLocale, setUiLocale] = useState(locale);
    const [contentLocale, setContentLocale] = useState(selectedLocale);
    return (
      <ApolloProvider client={client}>
        <IntlProvider locale={uiLocale} messages={{}}>
          <button onClick={() => setUiLocale('de')}>Deutsch</button>
          <button onClick={() => setContentLocale('en-US')}>US content</button>
          <AppContext.Provider
            value={
              contentLocale
                ? {
                    selectedLocale: contentLocale,
                    setSelectedLocale: setContentLocale,
                    languageDialectList: [],
                    isSystemReady: true,
                    shopInfo: null,
                  }
                : undefined
            }
          >
            <DateDisplay dates={dates} options={options} />
          </AppContext.Provider>
        </IntlProvider>
      </ApolloProvider>
    );
  };

  cy.mount(<Harness />);
};

describe('regional date formatting', () => {
  it('preserves the selected content locale and updates when it changes', () => {
    mountDates({
      selectedLocale: 'de-CH',
      dates: ['2026-05-08T08:58:00Z'],
      options: { month: 'long', timeZone: 'UTC' },
    });

    cy.get('[data-cy="date-locale"]').should('have.text', 'de-CH');
    cy.get('[data-cy="date-0"]').should('have.text', 'Mai');
    cy.contains('button', 'US content').click();
    cy.get('[data-cy="date-locale"]').should('have.text', 'en-US');
    cy.get('[data-cy="date-0"]').should('have.text', 'May');
  });

  it('falls back to the UI language and shop region for invalid stored locales', () => {
    mountDates({ selectedLocale: 'invalid_locale' });

    cy.get('[data-cy="date-locale"]').should('have.text', 'en-CH');
    cy.get('[data-cy="date-0"]').should('have.text', '07.09.2026, 08:58');
  });

  it('formats order dates with the shop region while viewing English', () => {
    mountDates();

    cy.get('[data-cy="date-locale"]').should('have.text', 'en-CH');
    cy.get('[data-cy="date-0"]').should('have.text', '07.09.2026, 08:58');
  });

  it('updates the formatting language when the UI language changes', () => {
    mountDates({
      options: { month: 'long', timeZone: 'UTC' },
      dates: ['2026-05-08T08:58:00Z'],
    });

    cy.get('[data-cy="date-0"]').should('have.text', 'May');
    cy.contains('button', 'Deutsch').click();
    cy.get('[data-cy="date-locale"]').should('have.text', 'de-CH');
    cy.get('[data-cy="date-0"]').should('have.text', 'Mai');
  });

  it('keeps an explicit UI region and uses the UI language without a shop country', () => {
    expect(resolveDateTimeLocale('en-US', 'CH')).to.equal('en-US');
    mountDates({ country: null });

    cy.get('[data-cy="date-locale"]').should('have.text', 'en');
    cy.get('[data-cy="date-0"]').should('have.text', '9/7/26, 8:58 AM');
  });

  it('distinguishes script subtags from regions and tolerates invalid country codes', () => {
    expect(resolveDateTimeLocale('zh-Hant', 'TW')).to.equal('zh-Hant-TW');
    expect(resolveDateTimeLocale('en', 'invalid')).to.equal('en');
  });

  it('formats epoch values and rejects only missing or invalid dates', () => {
    mountDates({
      dates: [
        0,
        new Date(0),
        '1970-01-01T00:00:00Z',
        null,
        undefined,
        '',
        'invalid',
        new Date(NaN),
      ],
    });

    for (const index of [0, 1, 2]) {
      cy.get(`[data-cy="date-${index}"]`).should(
        'have.text',
        '01.01.1970, 00:00',
      );
    }
    for (const index of [3, 4, 5, 6, 7]) {
      cy.get(`[data-cy="date-${index}"]`).should('have.text', 'n/a');
    }
  });

  it('preserves the caller’s time zone and date options', () => {
    mountDates({ options: { ...orderOptions, timeZone: 'America/New_York' } });

    cy.get('[data-cy="date-0"]').should('have.text', '07.09.2026, 04:58');
  });
});
