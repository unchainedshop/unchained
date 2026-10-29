import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { UpdateECBRates } from './adapter.ts';

// Response shape of https://api.frankfurter.dev/v2/rates?base=EUR&providers=ecb
const ecbRates = [
  { date: '2026-09-25', base: 'EUR', quote: 'CHF', rate: 0.9445 },
  { date: '2026-09-25', base: 'EUR', quote: 'EUR', rate: 1 },
  { date: '2026-09-25', base: 'EUR', quote: 'JPY', rate: 179.7 },
  { date: '2026-09-25', base: 'EUR', quote: 'USD', rate: 1.1403 },
];

// Response shape of https://allratestoday.com/api/open/latest/EUR
const allRatesTodayRates = {
  result: 'success',
  base_code: 'EUR',
  date: '2026-09-25',
  rates: { CHF: 0.9445, EUR: 1, JPY: 179.7, USD: 1.1403 },
};

const createUnchainedAPI = (isoCodes: string[]) => {
  const updateRates = mock.fn(async () => true);
  const unchainedAPI = {
    modules: {
      currencies: { findCurrencies: async () => isoCodes.map((isoCode) => ({ isoCode })) },
      products: { prices: { rates: { updateRates } } },
    },
  } as any;
  return { unchainedAPI, updateRates };
};

describe('UpdateECBRates', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('stores the ECB rates for the currencies of the shop', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(ecbRates));
    const { unchainedAPI, updateRates } = createUnchainedAPI(['EUR', 'CHF', 'USD', 'BTC']);

    const result = await UpdateECBRates.doWork({}, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, { success: true, result: { ratesUpdated: 2 } });
    assert.strictEqual(
      fetchMock.mock.calls[0].arguments[0],
      'https://api.frankfurter.dev/v2/rates?base=EUR&providers=ecb',
    );
    const [rates] = updateRates.mock.calls[0].arguments;
    assert.deepStrictEqual(
      rates.map(({ baseCurrency, quoteCurrency, rate }) => ({ baseCurrency, quoteCurrency, rate })),
      [
        { baseCurrency: 'EUR', quoteCurrency: 'CHF', rate: 0.9445 },
        { baseCurrency: 'EUR', quoteCurrency: 'USD', rate: 1.1403 },
      ],
    );
    assert.strictEqual(rates[0].expiresAt.getTime() - rates[0].timestamp.getTime(), 24 * 60 * 60 * 1000);
  });

  it('does not request rates when EUR is not configured', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(ecbRates));
    const { unchainedAPI, updateRates } = createUnchainedAPI(['CHF', 'USD']);

    const result = await UpdateECBRates.doWork({}, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, {
      success: true,
      result: { ratesUpdated: 0, info: 'EUR not enabled' },
    });
    assert.strictEqual(fetchMock.mock.callCount(), 0);
    assert.strictEqual(updateRates.mock.callCount(), 0);
  });

  it('does not call the fallback when Frankfurter answers', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(ecbRates));
    const { unchainedAPI } = createUnchainedAPI(['EUR', 'CHF', 'USD']);

    await UpdateECBRates.doWork({}, unchainedAPI, 'work-id');

    assert.strictEqual(fetchMock.mock.callCount(), 1);
  });

  it('falls back to AllRatesToday when Frankfurter responds with an error', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async (url: string) =>
      url.startsWith('https://api.frankfurter.dev/')
        ? new Response('Internal Server Error', { status: 500 })
        : Response.json(allRatesTodayRates),
    );
    const { unchainedAPI, updateRates } = createUnchainedAPI(['EUR', 'CHF', 'USD', 'BTC']);

    const result = await UpdateECBRates.doWork({}, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, { success: true, result: { ratesUpdated: 2 } });
    assert.strictEqual(fetchMock.mock.callCount(), 2);
    assert.strictEqual(
      fetchMock.mock.calls[1].arguments[0],
      'https://allratestoday.com/api/open/latest/EUR',
    );
    const [rates] = updateRates.mock.calls[0].arguments;
    assert.deepStrictEqual(
      rates.map(({ baseCurrency, quoteCurrency, rate }) => ({ baseCurrency, quoteCurrency, rate })),
      [
        { baseCurrency: 'EUR', quoteCurrency: 'CHF', rate: 0.9445 },
        { baseCurrency: 'EUR', quoteCurrency: 'USD', rate: 1.1403 },
      ],
    );
  });

  it('falls back to AllRatesToday when Frankfurter returns no rates', async () => {
    mock.method(globalThis, 'fetch', async (url: string) =>
      url.startsWith('https://api.frankfurter.dev/')
        ? Response.json([])
        : Response.json(allRatesTodayRates),
    );
    const { unchainedAPI, updateRates } = createUnchainedAPI(['EUR', 'CHF']);

    const result = await UpdateECBRates.doWork({}, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, { success: true, result: { ratesUpdated: 1 } });
    assert.strictEqual(updateRates.mock.callCount(), 1);
  });

  it('fails when both sources respond with an error', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('Bad Gateway', { status: 502 }));
    const { unchainedAPI, updateRates } = createUnchainedAPI(['EUR', 'CHF']);

    const result = await UpdateECBRates.doWork({}, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, {
      success: false,
      error: {
        name: 'UPDATE_ECB_RATES_FAILED',
        message:
          'Updating ECB Rates failed: Frankfurter responded with HTTP 502; AllRatesToday responded with HTTP 502',
      },
    });
    assert.strictEqual(updateRates.mock.callCount(), 0);
  });

  it('fails when both sources return no rates', async () => {
    mock.method(globalThis, 'fetch', async (url: string) =>
      url.startsWith('https://api.frankfurter.dev/')
        ? Response.json([])
        : Response.json({ result: 'success', base_code: 'EUR', rates: {} }),
    );
    const { unchainedAPI, updateRates } = createUnchainedAPI(['EUR', 'CHF']);

    const result = await UpdateECBRates.doWork({}, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, {
      success: false,
      error: {
        name: 'UPDATE_ECB_RATES_FAILED',
        message:
          'Updating ECB Rates failed: Frankfurter returned no ECB rates; AllRatesToday returned no ECB rates',
      },
    });
    assert.strictEqual(updateRates.mock.callCount(), 0);
  });
});
