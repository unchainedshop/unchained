import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { TicketingAPI } from '../types.js';

export class GoogleEventTicketWallet {
  authPromise;
  keyFilePath;
  credentials;
  client;
  issuerId;

  constructor(issuerId: string) {
    this.keyFilePath = path.resolve(
      path.dirname(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
      process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
    );
    this.issuerId = issuerId;
  }

  async auth() {
    const auth = new google.auth.GoogleAuth({
      keyFile: this.keyFilePath,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const { default: keyFile } = await import(this.keyFilePath, {
      with: { type: 'json' },
    });
    this.credentials = keyFile;

    this.client = google.walletobjects({
      version: 'v1',
      auth: auth,
    });
  }

  async createClass(classSuffix, { id = null, ...options }) {
    try {
      await this.client.eventticketclass.get({
        resourceId: `${this.issuerId}.${classSuffix}`,
      });
      return `${this.issuerId}.${classSuffix}`;
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        return `${this.issuerId}.${classSuffix}`;
      }
    }
    const newClass: any = {
      ...options,
      eventId: `${this.issuerId}.${classSuffix}`,
      id: id || `${this.issuerId}.${classSuffix}`,
      reviewStatus: 'UNDER_REVIEW',
      issuerName: 'Unchained Commerce',
      textModulesData: [
        {
          header: options.subtitle,
          body: options.description,
          id: 'TEXT_MODULE_ID',
        },
      ],
      dateTime: {
        ...options.schedule,
        doorsOpenLabel: 'Opening Hours',
      },
      eventName: {
        defaultValue: {
          language: 'de-ch',
          value: options.title,
        },
      },
      logo: {
        sourceUri: {
          uri: 'https://unchained.shop/_next/static/media/logo-light.2b704587.svg',
        },
        contentDescription: {
          defaultValue: {
            language: 'de-ch',
            value: 'logo',
          },
        },
      },
      imageModulesData: [
        {
          mainImage: {
            sourceUri: {
              uri: 'https://unchained.shop/_next/static/media/logo-light.2b704587.svg',
            },
            contentDescription: {
              defaultValue: {
                language: 'de-ch',
                value: 'logo',
              },
            },
          },
          id: 'IMAGE_MODULE_ID',
        },
      ],
    };

    if (options.image) {
      newClass.heroImage = {
        sourceUri: {
          uri:
            process.env.NODE_ENV !== 'production'
              ? 'https://unchained.shop/_next/static/media/logo-light.2b704587.svg'
              : options.image,
        },
        contentDescription: {
          defaultValue: {
            language: 'de-ch',
            value: 'Hero image description',
          },
        },
      };
    }
    await this.client.eventticketclass.insert({
      requestBody: newClass,
    });

    return `${this.issuerId}.${classSuffix}`;
  }

  async upsertClass(classSuffix, { id = null, ...options }) {
    let response;

    const newClass: any = {
      eventId: `${this.issuerId}.${classSuffix}`,
      id: id || `${this.issuerId}.${classSuffix}`,
      hexBackgroundColor: '#FFFFFF',
      reviewStatus: 'UNDER_REVIEW',
      issuerName: 'Unchained Commerce',
      countryCode: 'ch',
      textModulesData: [
        {
          header: options.subtitle,
          body: options?.description,
          id: 'TEXT_MODULE_ID',
        },
      ],

      eventName: {
        defaultValue: {
          language: 'de-ch',
          value: options.title,
        },
      },
      homepageUri: {
        uri: 'https://unchained.shop',
        description: 'Unchained Commerce',
      },
    };

    if (options.image) {
      newClass.heroImage = {
        sourceUri: {
          uri: options.image,
        },
        contentDescription: {
          defaultValue: {
            language: 'de-ch',
            value: options.title,
          },
        },
      };
    }

    try {
      response = await this.client.eventticketclass.get({
        resourceId: `${this.issuerId}.${classSuffix}`,
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        response = await this.client.eventticketclass.insert({
          requestBody: newClass,
        });
        return `${this.issuerId}.${classSuffix}`;
      } else {
        console.error(err);
        return `${this.issuerId}.${classSuffix}`;
      }
    }

    const updatedClass = {
      ...response.data,
      ...newClass,
      barcode: {
        type: 'QR_CODE',
        value: options?.barcodeWithUrl,
      },
    };
    updatedClass['reviewStatus'] = 'UNDER_REVIEW';
    response = await this.client.eventticketclass.update({
      resourceId: `${this.issuerId}.${classSuffix}`,
      requestBody: updatedClass,
    });

    console.log('Class update response');

    return `${this.issuerId}.${classSuffix}`;
  }
  async createObject(classSuffix, objectSuffix) {
    try {
      await this.client.eventticketobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`,
      });

      console.log(`Object ${this.issuerId}.${objectSuffix} already exists!`);

      return `${this.issuerId}.${objectSuffix}`;
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        console.error(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    const newObject = {
      id: `${this.issuerId}.${objectSuffix}`,
      classId: `${this.issuerId}.${classSuffix}`,
      state: 'ACTIVE',
      ticketNumber: objectSuffix,
    };

    await this.client.eventticketobject.insert({
      requestBody: newObject,
    });

    console.log('Object insert response');
    return `${this.issuerId}.${objectSuffix}`;
  }

  async upsertObject(classSuffix, objectSuffix, barcodeWithUrl) {
    let response;
    const newObject = {
      id: `${this.issuerId}.${objectSuffix}`,
      classId: `${this.issuerId}.${classSuffix}`,
      state: 'ACTIVE',
      ticketNumber: objectSuffix,
      barcode: {
        type: 'QR_CODE',
        value: barcodeWithUrl,
      },
      passConstraints: {
        screenshotEligibility: 'INELIGIBLE',
      },
    };
    try {
      response = await this.client.eventticketobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`,
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`Object ${this.issuerId}.${objectSuffix} not found!`);
        response = await this.client.eventticketobject.insert({
          requestBody: newObject,
        });
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        console.error(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    const updatedObject = {
      ...response.data,
      ...newObject,
    };

    await this.client.eventticketobject.update({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: updatedObject,
    });

    console.log('Object update response');
    return `${this.issuerId}.${objectSuffix}`;
  }

  async expireObject(objectSuffix) {
    try {
      await this.client.eventticketobject.get({
        resourceId: `${this.issuerId}.${objectSuffix}`,
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`Object ${this.issuerId}.${objectSuffix} not found!`);
        return `${this.issuerId}.${objectSuffix}`;
      } else {
        console.error(err);
        return `${this.issuerId}.${objectSuffix}`;
      }
    }

    const patchBody = {
      state: 'EXPIRED',
    };

    await this.client.eventticketobject.patch({
      resourceId: `${this.issuerId}.${objectSuffix}`,
      requestBody: patchBody,
    });

    console.log('Object expiration response');

    return `${this.issuerId}.${objectSuffix}`;
  }

  createJwtNewObjects(classSuffix, objectSuffix) {
    const newClass = {
      id: `${this.issuerId}.${classSuffix}`,
    };
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
      payload: {
        eventTicketClasses: [newClass],
        eventTicketObjects: [newObject],
      },
    };

    const token = jwt.sign(claims, this.credentials.private_key, {
      algorithm: 'RS256',
    });

    console.log(`https://pay.google.com/gp/v/save/${token}`);

    return `https://pay.google.com/gp/v/save/${token}`;
  }
}

export default async (token, unchainedAPI: TicketingAPI) => {
  const GoogleWallet = new GoogleEventTicketWallet(process.env.GOOGLE_WALLET_ISSUER_ID as string);
  await GoogleWallet.auth();

  const product = await unchainedAPI.modules.products.findProduct({
    productId: token.productId,
  });
  if (!product) return;
  const hash = await unchainedAPI.modules.warehousing.buildAccessKeyForToken(token._id);
  const barcodeWithUrl = `${process.env.ROOT_URL}/${token._id}?hash=${hash}`;

  const [firstMedia] = await unchainedAPI.modules.products.media.findProductMedias({
    productId: token.productId,
  });

  const file =
    firstMedia?.mediaId &&
    (await unchainedAPI.modules.files.findFile({
      fileId: firstMedia.mediaId,
    }));
  const url = file && (await unchainedAPI.modules.files.normalizeUrl(file?.url as string, {}));

  const productTexts = await unchainedAPI.modules.products.texts.findLocalizedText({
    productId: token.productId,
    locale: 'de' as any,
  });

  const description = productTexts.description;

  await GoogleWallet.upsertClass(product._id, {
    title: productTexts.title,
    barcodeWithUrl,
    subtitle: product.meta?.location || productTexts?.subtitle,
    description,
    image: url,
  });

  await GoogleWallet.upsertObject(product._id, token.chainTokenId, barcodeWithUrl);

  const asURL = async () => GoogleWallet.createJwtNewObjects(product._id, token.chainTokenId);

  return { asURL };
};
