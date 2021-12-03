import {
  WarehousingDirector,
  WarehousingAdapter,
} from 'meteor/unchained:core-warehousing';
import Sheets from 'node-sheets';
import { log } from 'meteor/unchained:logger';
import LRU from 'lru-cache';

const { NODE_ENV, GOOGLE_SHEETS_ID, GOOGLE_SHEETS_PRIVATE_KEY_DATA } =
  process.env;

const maxAge = NODE_ENV === 'production' ? 1000 * 60 * 60 : -1; // 1 hour or 1 second
let updateGoogleCache;
const googleCache = new LRU({
  max: 500,
  maxAge, // 1 second in dev
  stale: true,
  dispose() {
    updateGoogleCache();
  },
});

async function downloadSpreadsheet() {
  if (!GOOGLE_SHEETS_PRIVATE_KEY_DATA || !GOOGLE_SHEETS_ID) return null;
  try {
    // https://docs.google.com/spreadsheets/d/GOOGLE_SHEETS_ID/edit?usp=sharing
    const gs = new Sheets(GOOGLE_SHEETS_ID);
    const authData = JSON.parse(GOOGLE_SHEETS_PRIVATE_KEY_DATA);
    await gs.authorizeJWT(authData);
    const delivery = await gs.tables('delivery!A:ZZZ');
    const inventory = await gs.tables('inventory!A:ZZZ');
    log(`GoogleSheet: Updated cache with TTL: ${maxAge}`, {
      level: 'verbose',
    });
    return {
      delivery,
      inventory,
    };
  } catch (err) {
    log(err, { level: 'error' });
    throw err;
  }
}

updateGoogleCache = async () => {
  try {
    const sheet = await downloadSpreadsheet();
    if (sheet) {
      googleCache.set('tables', sheet);
      return sheet;
    }
  } catch (e) {
    log(e, { level: 'error' });
  }
  return null;
};

updateGoogleCache();

class GoogleSheets extends WarehousingAdapter {
  static key = 'shop.unchained.warehousing.google-sheets';

  static version = '1.0';

  static label = 'Google Sheets';

  static orderIndex = 0;

  static initialConfiguration = [
    {
      key: 'address',
      value: null,
    },
  ];

  static typeSupported(type) {
    return type === 'PHYSICAL';
  }

  static async getRows(name) {
    const cachedTables = googleCache.get('tables');
    let tables = cachedTables;
    if (!cachedTables) {
      tables = await updateGoogleCache();
    }
    if (!tables || !tables[name] || !tables[name].rows) return [];
    return tables[name].rows;
  }

  // eslint-disable-next-line
  isActive(context) {
    return true;
  }

  // eslint-disable-next-line
  configurationError() {
    return null;
  }

  async getRemoteTime(sku, quantity, selector) {
    const rows = await this.constructor.getRows('delivery');
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
      { level: 'verbose' }
    );
    return time;
  }

  async getRemoteInventory(sku) {
    const rows = await this.constructor.getRows('inventory');
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
      level: 'verbose',
    });
    return amount;
  }

  async stock() {
    const { product } = this.context;
    const { sku } = product.warehousing || {};
    return this.getRemoteInventory(sku);
  }

  async productionTime(quantity) {
    const { product } = this.context;
    const { sku } = product.warehousing || {};
    if (!sku) return null;
    const selector = 'WAREHOUSE_HOURS';
    const timeInHours = await this.getRemoteTime(
      sku.toUpperCase(),
      quantity,
      selector
    );
    if (!timeInHours) return null;
    return timeInHours * 60 * 60 * 1000;
  }

  async commissioningTime(quantity) {
    const { product, deliveryProvider } = this.context;
    const { sku } = product.warehousing || {};
    if (!sku) return null;
    const { type } = deliveryProvider;
    const selector = `DELIVERY_HOURS:${type}`;
    const timeInHours = await this.getRemoteTime(
      sku.toUpperCase(),
      quantity,
      selector
    );
    if (!timeInHours) return null;
    return timeInHours * 60 * 60 * 1000;
  }
}

WarehousingDirector.registerAdapter(GoogleSheets);
