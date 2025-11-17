import path from 'node:path';
import { Context } from '@unchainedshop/api';

let google: any = null;
let jwt: any = null;

try {
  google = await import('googleapis');
} catch {
  console.warn(
    'npm dependency googleapis not installed — Googleapi should be installed in order to use the default google wallet.',
  );
}

try {
  jwt = await import('jsonwebtoken');
} catch {
  console.warn(
    'npm dependency jsonwebtoken not installed — jsonwebtoken should be installed in order to use the default google wallet.',
  );
}

export class GoogleEventTicketWallet {
  authPromise;
  keyFilePath;
  credentials;
  client;
  issuerId;

  constructor(issuerId: string) {
    if (!google)
      throw new Error('googlewallet can not be used, npm dependency googleapis is not installed');
    if (!google)
      throw new Error('googlewallet can not be used, npm jsonwebtoken googleapis is not installed');
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

    const { default: keyFile } = await import(this.keyFilePath, {
      with: { type: 'json' },
    });
    this.credentials = keyFile;

    this.client = new google.walletobjects_v1.Walletobjects({
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
              ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7vN9d0jQlCl-sISjxq9IhDaYknKyxx1a8vw&s'
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
      textModulesData: options?.subtitle
        ? [
            {
              header: options.subtitle,
              body: options?.description,
              id: 'TEXT_MODULE_ID',
            },
          ]
        : [],

      eventName: {
        defaultValue: {
          language: 'de-CH',
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
          uri:
            process.env.NODE_ENV !== 'production'
              ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7vN9d0jQlCl-sISjxq9IhDaYknKyxx1a8vw&s'
              : options.image,
        },
        contentDescription: {
          defaultValue: {
            language: 'de-CH',
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
    const token = jwt.default.sign(claims, this.credentials.private_key, {
      algorithm: 'RS256',
    });

    return `https://pay.google.com/gp/v/save/${token}`;
  }
}

export default async (token, unchainedAPI: Context) => {
  const GoogleWallet = new GoogleEventTicketWallet(process.env.GOOGLE_WALLET_ISSUER_ID as string);
  await GoogleWallet.auth();
  const { user, locale } = unchainedAPI;
  const normalizedUserLocale = user?.lastLogin?.locale || locale?.language;
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
    locale: normalizedUserLocale as any,
  });

  await GoogleWallet.upsertClass(product._id, {
    title: productTexts.title,
    barcodeWithUrl,
    subtitle: product.meta?.location || productTexts?.subtitle,
    description: productTexts?.description,
    image: url,
  });

  await GoogleWallet.upsertObject(product._id, token.tokenSerialNumber, barcodeWithUrl);

  const asURL = async () => GoogleWallet.createJwtNewObjects(product._id, token.tokenSerialNumber);

  return { asURL };
};
