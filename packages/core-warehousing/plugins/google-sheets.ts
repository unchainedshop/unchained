import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from 'meteor/unchained:core-warehousing';
import Sheets from 'node-sheets';
import { log, LogLevel } from 'meteor/unchained:logger';
import LRU from 'lru-cache';
import { IWarehousingAdapter } from '@unchainedshop/types/warehousing';

const { NODE_ENV, GOOGLE_SHEETS_ID, GOOGLE_SHEETS_PRIVATE_KEY_DATA } =
  process.env;

const maxAge = NODE_ENV === 'production' ? 1000 * 60 * 60 : -1; // 1 hour or 1 second

const downloadSpreadsheet = async () => {
  if (!GOOGLE_SHEETS_PRIVATE_KEY_DATA || !GOOGLE_SHEETS_ID) return null;
  try {
    // https://docs.google.com/spreadsheets/d/GOOGLE_SHEETS_ID/edit?usp=sharing
    const gs = new Sheets(GOOGLE_SHEETS_ID);
    const authData = JSON.parse(GOOGLE_SHEETS_PRIVATE_KEY_DATA);
    await gs.authorizeJWT(authData);
    const delivery = await gs.tables('delivery!A:ZZZ');
    const inventory = await gs.tables('inventory!A:ZZZ');
    log(`GoogleSheet: Updated cache with TTL: ${maxAge}`, {
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

const updateGoogleCache = async () => {
  try {
    const sheet = await downloadSpreadsheet();
    if (sheet) {
      googleCache.set('tables', sheet);
      return sheet;
    }
  } catch (e) {
    log(e, { level: LogLevel.Error });
  }
  return null;
};

const googleCache = new LRU({
  max: 500,
  maxAge, // 1 second in dev
  stale: true,
  dispose() {
    updateGoogleCache();
  },
});

updateGoogleCache();

const getRows = async (name: string) => {
  const cachedTables = googleCache.get('tables');
  let tables = cachedTables;
  if (!cachedTables) {
    tables = await updateGoogleCache();
  }
  if (!tables || !tables[name] || !tables[name].rows) return [];
  return tables[name].rows;
};

const getRemoteTime = async (
  sku: string,
  quantity: number,
  selector: string
) => {
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
  log(
    `GoogleSheet: Resolve Time ${selector} (${quantity}) for ${sku}: ${time}`,
    { level: LogLevel.Verbose }
  );
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
  version: '1.0',
  label: 'Google Sheets',
  orderIndex: 0,

  typeSupported: (type) => {
    return type === WarehousingProviderType.PHYSICAL;
  },

  actions: (_, context) => {
    // const initialConfiguration = [
    //   {
    //     key: 'address',
    //     value: null,
    //   },
    // ];

    return {
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
        const timeInHours = await getRemoteTime(
          sku.toUpperCase(),
          quantity,
          selector
        );
        if (!timeInHours) return null;
        return timeInHours * 60 * 60 * 1000;
      },

      commissioningTime: async (quantity) => {
        const { product, deliveryProvider } = context;
        const { sku } = product.warehousing || {};
        if (!sku) return null;
        const { type } = deliveryProvider;
        const selector = `DELIVERY_HOURS:${type}`;
        const timeInHours = await getRemoteTime(
          sku.toUpperCase(),
          quantity,
          selector
        );
        if (!timeInHours) return null;
        return timeInHours * 60 * 60 * 1000;
      },
    };
  },
};

WarehousingDirector.registerAdapter(GoogleSheets);
