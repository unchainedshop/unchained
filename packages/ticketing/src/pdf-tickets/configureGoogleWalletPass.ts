import path from 'node:path';
import { Context } from '@unchainedshop/api';
import { EventTicketClass, GoogleWalletPassConfigOptions } from './types.js';

let google: any = null;
let jwt: any = null;

try {
  google = await import('googleapis');
} catch {
  console.warn('npm dependency googleapis not installed — install to use Google Wallet functionality.');
}

try {
  jwt = await import('jsonwebtoken');
} catch {
  console.warn(
    'npm dependency jsonwebtoken not installed — install to use Google Wallet functionality.',
  );
}

export class GoogleEventTicketWallet {
  authPromise: any;
  keyFilePath: string;
  credentials: any;
  client: any;
  issuerId: string;

  constructor(issuerId: string) {
    if (!google) throw new Error('Google Wallet cannot be used — googleapis not installed');
    if (!jwt) throw new Error('Google Wallet cannot be used — jsonwebtoken not installed');

    this.keyFilePath = path.resolve(
      path.dirname(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
      process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
    );
    this.issuerId = issuerId;
  }

  async auth() {
    if (!google) return;

    const auth = new google.Auth.GoogleAuth({
      keyFile: this.keyFilePath,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const { default: keyFile } = await import(this.keyFilePath, { with: { type: 'json' } });
    this.credentials = keyFile;

    this.client = new google.walletobjects_v1.Walletobjects({
      version: 'v1',
      auth: auth,
    });
  }

  private mergeWithDefaults<T extends Record<string, any>>(defaults: T, options?: Partial<T>): T {
    const merged: any = { ...defaults };
    if (!options) return merged;

    for (const key in options) {
      if (options[key] !== undefined) merged[key] = options[key];
    }
    return merged;
  }

  async upsertClass(classSuffix: string, options?: Partial<EventTicketClass>) {
    const defaults: EventTicketClass = {
      eventId: `${this.issuerId}.${classSuffix}`,
      hexBackgroundColor: '#FFFFFF',
      reviewStatus: 'UNDER_REVIEW',
      issuerName: 'Unchained Commerce',
      countryCode: 'ch',
      textModulesData: [
        { header: 'header placeholder', body: 'body placeholder', id: 'TEXT_MODULE_ID' },
      ],
      imageModulesData: [
        {
          mainImage: {
            sourceUri: { uri: 'https://dummyimage.com/600x400/000/fff.png&text=Main+Image' },
            contentDescription: { defaultValue: { language: 'de-CH', value: 'logo' } },
          },
          id: 'IMAGE_MODULE_ID',
        },
      ],
      eventName: { defaultValue: { language: 'de-CH', value: 'Event Name Placeholder' } },
      homepageUri: { uri: 'https://unchained.shop', description: 'Unchained Commerce' },
      logo: {
        sourceUri: { uri: 'https://dummyimage.com/600x400/000/fff.png&text=Logo' },
        contentDescription: { defaultValue: { language: 'de-CH', value: 'logo placeholder' } },
      },
      heroImage: {
        sourceUri: { uri: 'https://dummyimage.com/600x400/000/fff.png&text=Hero+Image' },
        contentDescription: { defaultValue: { language: 'de-CH', value: 'Hero image description' } },
      },
    };

    const newClass = this.mergeWithDefaults(defaults, options);

    let response;
    try {
      response = await this.client.eventticketclass.get({
        resourceId: `${this.issuerId}.${classSuffix}`,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        response = await this.client.eventticketclass.insert({ requestBody: newClass });
        return `${this.issuerId}.${classSuffix}`;
      } else {
        console.error(err);
        return `${this.issuerId}.${classSuffix}`;
      }
    }

    const updatedClass = { ...response.data, ...newClass, reviewStatus: 'UNDER_REVIEW' };
    response = await this.client.eventticketclass.update({
      resourceId: `${this.issuerId}.${classSuffix}`,
      requestBody: updatedClass,
    });

    return `${this.issuerId}.${classSuffix}`;
  }

  async upsertObject(classSuffix: string, objectSuffix: string, barcodeWithUrl: string) {
    const defaults = {
      id: `${this.issuerId}.${objectSuffix}`,
      classId: `${this.issuerId}.${classSuffix}`,
      state: 'ACTIVE',
      ticketNumber: objectSuffix,
      barcode: { type: 'QR_CODE', value: barcodeWithUrl },
      passConstraints: { screenshotEligibility: 'INELIGIBLE' },
    };

    const newObject = this.mergeWithDefaults(defaults);

    let response;
    try {
      response = await this.client.eventticketobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        response = await this.client.eventticketobject.insert({ requestBody: newObject });
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        console.error(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    const updatedObject = { ...response.data, ...newObject };
    await this.client.eventticketobject.update({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: updatedObject,
    });

    return `${this.issuerId}.${objectSuffix}`;
  }

  async expireObject(objectSuffix: string) {
    try {
      await this.client.eventticketobject.get({ resourceId: `${this.issuerId}.${objectSuffix}` });
    } catch (err) {
      if (err.response?.status === 404) {
        console.log(`Object ${this.issuerId}.${objectSuffix} not found!`);
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        console.error(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    await this.client.eventticketobject.patch({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: { state: 'EXPIRED' },
    });

    return `${this.issuerId}.${objectSuffix}`;
  }

  createJwtNewObjects(classSuffix: string, objectSuffix: string) {
    const newClass = { id: `${this.issuerId}.${classSuffix}` };
    const newObject = {
      id: `${this.issuerId}.${objectSuffix}`,
      classId: `${this.issuerId}.${classSuffix}`,
      state: 'ACTIVE',
    };

    const claims = {
      iss: this.credentials.client_email,
      aud: 'google',
      origins: ['www.example.com'],
      typ: 'savetowallet',
      payload: { eventTicketClasses: [newClass], eventTicketObjects: [newObject] },
    };

    const token = jwt.default.sign(claims, this.credentials.private_key, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  }
}

export default function configureGoogleWalletPass(config: GoogleWalletPassConfigOptions) {
  return async (token, unchainedAPI: Context) => {
    const GoogleWallet = new GoogleEventTicketWallet(process.env.GOOGLE_WALLET_ISSUER_ID as string);
    await GoogleWallet.auth();
    const isProduction = process.env.NODE_ENV === 'production';
    const { user, locale } = unchainedAPI;
    const normalizedUserLocale = user?.lastLogin?.locale || locale?.language;

    const product = await unchainedAPI.modules.products.findProduct({ productId: token.productId });
    if (!product) return;

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
      locale: normalizedUserLocale as any,
    });

    await GoogleWallet.upsertClass(product._id, {
      ...config,
      eventName: productTexts.title
        ? { defaultValue: { language: productTexts.locale, value: productTexts.title } }
        : undefined,
      textModulesData: [
        { header: productTexts?.title, body: productTexts?.description, id: 'TEXT_MODULE_ID' },
      ],
      heroImage:
        isProduction && url
          ? {
              sourceUri: { uri: url },
              contentDescription: {
                defaultValue: {
                  language: normalizedUserLocale || 'de-CH',
                  value: 'Hero image description',
                },
              },
            }
          : undefined,
    });

    await GoogleWallet.upsertObject(product._id, token.tokenSerialNumber, barcodeWithUrl);

    return { asURL: async () => GoogleWallet.createJwtNewObjects(product._id, token.tokenSerialNumber) };
  };
}
