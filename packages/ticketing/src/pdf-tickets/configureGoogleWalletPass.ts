import path from 'node:path';
import type { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import type * as GoogleApisTypes from 'googleapis';
import type * as JwtTypes from 'jsonwebtoken';
import type { EventTicketClass, GoogleWalletPassConfigOptions } from './types.js';

interface WarehousingToken {
  _id: string;
  productId: string;
  tokenSerialNumber: string;
}

const logger = createLogger('unchained:ticketing:google-wallet');

let google: typeof GoogleApisTypes | null = null;
let jwt: typeof JwtTypes | null = null;

try {
  google = await import('googleapis');
} catch {
  logger.warn('googleapis not installed — install to use Google Wallet functionality');
}

try {
  jwt = await import('jsonwebtoken');
} catch {
  logger.warn('jsonwebtoken not installed — install to use Google Wallet functionality');
}

interface GoogleCredentials {
  client_email: string;
  private_key: string;
}

interface GoogleWalletClient {
  eventticketclass: {
    get: (params: { resourceId: string }) => Promise<{ data: EventTicketClass }>;
    insert: (params: { requestBody: EventTicketClass }) => Promise<{ data: EventTicketClass }>;
    update: (params: {
      resourceId: string;
      requestBody: EventTicketClass;
    }) => Promise<{ data: EventTicketClass }>;
  };
  eventticketobject: {
    get: (params: { resourceId: string }) => Promise<{ data: Record<string, unknown> }>;
    insert: (params: {
      requestBody: Record<string, unknown>;
    }) => Promise<{ data: Record<string, unknown> }>;
    update: (params: {
      resourceId: string;
      requestBody: Record<string, unknown>;
    }) => Promise<{ data: Record<string, unknown> }>;
    patch: (params: {
      resourceId: string;
      requestBody: Record<string, unknown>;
    }) => Promise<{ data: Record<string, unknown> }>;
  };
}

function safeMerge<T extends object>(base: T, overrides?: Partial<T>): T {
  if (!overrides) return base;
  const result = { ...base } as T;
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const value = overrides[key];
    if (value !== undefined) {
      result[key] = value as T[keyof T];
    }
  }
  return result;
}

export class GoogleEventTicketWallet {
  private keyFilePath: string;
  private credentials: GoogleCredentials | null = null;
  private client: GoogleWalletClient | null = null;
  private issuerId: string;

  constructor(issuerId: string) {
    if (!google) throw new Error('Google Wallet cannot be used — googleapis not installed');
    if (!jwt) throw new Error('Google Wallet cannot be used — jsonwebtoken not installed');

    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable must be set');
    }

    this.keyFilePath = path.resolve(path.dirname(credPath), credPath);
    this.issuerId = issuerId;
  }

  async auth(): Promise<void> {
    if (!google) return;

    const auth = new google.Auth.GoogleAuth({
      keyFile: this.keyFilePath,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const { default: keyFile } = await import(this.keyFilePath, { with: { type: 'json' } });
    this.credentials = keyFile as GoogleCredentials;

    this.client = new google.walletobjects_v1.Walletobjects({
      auth: auth,
    }) as unknown as GoogleWalletClient;
  }

  async upsertClass(classSuffix: string, options?: Partial<EventTicketClass>): Promise<string> {
    if (!this.client) throw new Error('Google Wallet client not initialized. Call auth() first.');

    const defaults: EventTicketClass = {
      eventId: `${this.issuerId}.${classSuffix}`,
      hexBackgroundColor: '#FFFFFF',
      reviewStatus: 'UNDER_REVIEW',
      countryCode: 'CH',
    };

    const newClass = safeMerge(defaults, options);

    let response;
    try {
      response = await this.client.eventticketclass.get({
        resourceId: `${this.issuerId}.${classSuffix}`,
      });
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 404) {
        await this.client.eventticketclass.insert({ requestBody: newClass as EventTicketClass });
        return `${this.issuerId}.${classSuffix}`;
      } else {
        logger.error('Failed to get event ticket class', { error: err });
        throw err;
      }
    }

    const updatedClass = { ...response.data, ...newClass, reviewStatus: 'UNDER_REVIEW' as const };
    await this.client.eventticketclass.update({
      resourceId: `${this.issuerId}.${classSuffix}`,
      requestBody: updatedClass as EventTicketClass,
    });

    return `${this.issuerId}.${classSuffix}`;
  }

  async upsertObject(
    classSuffix: string,
    objectSuffix: string,
    barcodeWithUrl: string,
  ): Promise<string> {
    if (!this.client) throw new Error('Google Wallet client not initialized. Call auth() first.');

    const newObject = {
      id: `${this.issuerId}.${objectSuffix}`,
      classId: `${this.issuerId}.${classSuffix}`,
      state: 'ACTIVE',
      ticketNumber: objectSuffix,
      barcode: { type: 'QR_CODE', value: barcodeWithUrl },
      passConstraints: { screenshotEligibility: 'INELIGIBLE' },
    };

    let response;
    try {
      response = await this.client.eventticketobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`,
      });
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 404) {
        await this.client.eventticketobject.insert({ requestBody: newObject });
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        logger.error('Failed to get event ticket object', { error: err });
        throw err;
      }
    }

    const updatedObject = { ...response.data, ...newObject };
    await this.client.eventticketobject.update({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: updatedObject,
    });

    return `${this.issuerId}.${objectSuffix}`;
  }

  async expireObject(objectSuffix: string): Promise<string> {
    if (!this.client) throw new Error('Google Wallet client not initialized. Call auth() first.');

    try {
      await this.client.eventticketobject.get({ resourceId: `${this.issuerId}.${objectSuffix}` });
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 404) {
        logger.debug(`Object ${this.issuerId}.${objectSuffix} not found`);
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        logger.error('Failed to expire event ticket object', { error: err });
        throw err;
      }
    }

    await this.client.eventticketobject.patch({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: { state: 'EXPIRED' },
    });

    return `${this.issuerId}.${objectSuffix}`;
  }

  createJwtNewObjects(classSuffix: string, objectSuffix: string): string {
    if (!this.credentials) throw new Error('Credentials not loaded. Call auth() first.');
    if (!jwt) throw new Error('jsonwebtoken not installed');

    const newClass = { id: `${this.issuerId}.${classSuffix}` };
    const newObject = {
      id: `${this.issuerId}.${objectSuffix}`,
      classId: `${this.issuerId}.${classSuffix}`,
      state: 'ACTIVE',
    };

    const claims = {
      iss: this.credentials.client_email,
      aud: 'google',
      origins: [process.env.ROOT_URL || 'http://localhost:3000'],
      typ: 'savetowallet',
      payload: { eventTicketClasses: [newClass], eventTicketObjects: [newObject] },
    };

    const sign =
      (jwt as unknown as { default?: typeof JwtTypes }).default?.sign ||
      (jwt as typeof JwtTypes).sign;
    const token = sign(claims, this.credentials.private_key, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  }
}

export interface GoogleWalletPassResult {
  asURL: () => Promise<string>;
}

export default function configureGoogleWalletPass(
  config: GoogleWalletPassConfigOptions,
): (token: WarehousingToken, unchainedAPI: Context) => Promise<GoogleWalletPassResult | undefined> {
  return async (token: WarehousingToken, unchainedAPI: Context) => {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    if (!issuerId) {
      throw new Error('GOOGLE_WALLET_ISSUER_ID environment variable must be set');
    }

    const GoogleWallet = new GoogleEventTicketWallet(issuerId);
    await GoogleWallet.auth();

    const isProduction = process.env.NODE_ENV === 'production';
    const { user, locale } = unchainedAPI;
    const normalizedUserLocale = user?.lastLogin?.locale || locale?.language || 'en';

    const product = await unchainedAPI.modules.products.findProduct({ productId: token.productId });
    if (!product) return undefined;

    const hash = await unchainedAPI.modules.warehousing.buildAccessKeyForToken(token._id);
    const barcodeWithUrl = `${process.env.ROOT_URL}/${token._id}?hash=${hash}`;

    const [firstMedia] = await unchainedAPI.modules.products.media.findProductMedias({
      productId: token.productId,
    });
    const file =
      firstMedia?.mediaId && (await unchainedAPI.modules.files.findFile({ fileId: firstMedia.mediaId }));
    const url = file && (await unchainedAPI.modules.files.normalizeUrl(file.url as string, {}));

    const productTexts = await unchainedAPI.modules.products.texts.findLocalizedText({
      productId: token.productId,
      locale: new Intl.Locale(normalizedUserLocale),
    });

    await GoogleWallet.upsertClass(product._id, {
      ...config,
      eventName: productTexts?.title
        ? { defaultValue: { language: productTexts.locale, value: productTexts.title } }
        : undefined,
      textModulesData: productTexts
        ? [{ header: productTexts.title, body: productTexts.description, id: 'TEXT_MODULE_ID' }]
        : undefined,
      heroImage:
        isProduction && url
          ? {
              sourceUri: { uri: url },
              contentDescription: {
                defaultValue: {
                  language: normalizedUserLocale,
                  value: 'Event image',
                },
              },
            }
          : undefined,
    });

    await GoogleWallet.upsertObject(product._id, token.tokenSerialNumber, barcodeWithUrl);

    return {
      asURL: async () => GoogleWallet.createJwtNewObjects(product._id, token.tokenSerialNumber),
    };
  };
}
