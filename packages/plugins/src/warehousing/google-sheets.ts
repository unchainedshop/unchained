import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import Sheets from 'node-sheets';
import { log, LogLevel } from '@unchainedshop/logger';
import 'abort-controller/polyfill.js';
import { LRUCache } from 'lru-cache';
import { IWarehousingAdapter } from '@unchainedshop/types/warehousing.js';

const { NODE_ENV, GOOGLE_SHEETS_ID, GOOGLE_SHEETS_PRIVATE_KEY_DATA } = process.env;

const ttl = NODE_ENV === 'production' ? 1000 * 60 : 0; // 1 minute or 1 second

const downloadSpreadsheet = async () => {
  if (!GOOGLE_SHEETS_PRIVATE_KEY_DATA || !GOOGLE_SHEETS_ID) return null;
  try {
    // https://docs.google.com/spreadsheets/d/GOOGLE_SHEETS_ID/edit?usp=sharing
    const gs = new Sheets(GOOGLE_SHEETS_ID);
    const authData = JSON.parse(GOOGLE_SHEETS_PRIVATE_KEY_DATA);
    await gs.authorizeJWT(authData);
    const delivery = await gs.tables('delivery!A:ZZZ');
    const inventory = await gs.tables('inventory!A:ZZZ');
    log(`GoogleSheet: Updated cache with TTL: ${ttl}`, {
      level: LogLevel.Verbose,
    });
    return {
      delivery,
      inventory,
    };
  } catch (err) {
    log(err, { level: LogLevel.Error });
    throw err;
  }
};

const updateGoogleCache = async (cache) => {
  try {
    const sheet = await downloadSpreadsheet();
    if (sheet) {
      cache.set('tables', sheet);
      return sheet;
    }
  } catch (e) {
    log(e, { level: LogLevel.Error });
  }
  return null;
};

const googleCache = new LRUCache({
  max: 500,
  ttl, // 1 second in dev
  allowStale: true,
  dispose: () => {
    updateGoogleCache(googleCache);
  },
});

updateGoogleCache(googleCache);

const getRows = async (name: string) => {
  const cachedTables = googleCache.get('tables');
  let tables = cachedTables;
  if (!cachedTables) {
    tables = await updateGoogleCache(googleCache);
  }
  if (!tables || !tables[name] || !tables[name].rows) return [];
  return tables[name].rows;
};

const getRemoteTime = async (sku: string, quantity: number, selector: string) => {
  const rows = await getRows('delivery');
  const resolvedRow = rows.reduce((result, row) => {
    const parsedQuantity = parseInt(row.Quantity.value, 10);
    const parsedSKU = row.SKU.value.toUpperCase();
    if (parsedSKU === sku && parsedQuantity <= quantity) {
      return row;
    }
    return result;
  }, null);
  if (!resolvedRow) return null;
  const time = parseInt(resolvedRow[selector].value, 10) || 0;
  log(`GoogleSheet: Resolve Time ${selector} (${quantity}) for ${sku}: ${time}`, {
    level: LogLevel.Verbose,
  });
  return time;
};

const getRemoteInventory = async (sku: string) => {
  const rows = await getRows('inventory');
  const resolvedRow = [].concat(rows).reduce((result, row) => {
    if (result || !row) return result;
    const parsedSKU = row.SKU.value.toUpperCase();
    if (parsedSKU === sku) {
      return row;
    }
    return result;
  }, null);
  if (!resolvedRow) return null;
  const amount = parseInt(resolvedRow.Stock.value, 10) || 0;
  log(`GoogleSheet: Resolve Inventory for ${sku}: ${amount}`, {
    level: LogLevel.Verbose,
  });
  return amount;
};

const GoogleSheets: IWarehousingAdapter = {
  ...WarehousingAdapter,

  key: 'shop.unchained.warehousing.google-sheets',
  label: 'Google Sheets',
  version: '1.0.0',
  orderIndex: 0,

  typeSupported: (type) => {
    return type === WarehousingProviderType.PHYSICAL;
  },

  initialConfiguration: [
    {
      key: 'sheetId',
      value: null,
    },
  ],

  actions: (config, context) => {
    return {
      ...WarehousingAdapter.actions(config, context),

      isActive: () => {
        return true;
      },

      configurationError: () => {
        return null;
      },

      stock: async () => {
        const { sku } = context.product.warehousing || {};
        return getRemoteInventory(sku);
      },

      productionTime: async (quantity: number) => {
        const { sku } = context.product.warehousing || {};
        if (!sku) return null;
        const selector = 'WAREHOUSE_HOURS';
        const timeInHours = await getRemoteTime(sku.toUpperCase(), quantity, selector);
        if (!timeInHours) return null;
        return timeInHours * 60 * 60 * 1000;
      },

      commissioningTime: async (quantity) => {
        const { product, deliveryProvider } = context;
        const { sku } = product.warehousing || {};
        if (!sku) return null;
        const { type } = deliveryProvider;
        const selector = `DELIVERY_HOURS:${type}`;
        const timeInHours = await getRemoteTime(sku.toUpperCase(), quantity, selector);
        if (!timeInHours) return null;
        return timeInHours * 60 * 60 * 1000;
      },
    };
  },
};

WarehousingDirector.registerAdapter(GoogleSheets);
