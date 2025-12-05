import { UnchainedCore } from '@unchainedshop/core';
import { PassConfig } from './types.js';

let Template: any = null;
let constants: any = null;
/* eslint-disable @typescript-eslint/no-unused-vars */
let Pass: any = null;

try {
  const mod = await import('@walletpass/pass-js');
  Template = mod.Template;
  constants = mod.constants;
  Pass = mod.Pass;
} catch {
  console.warn(
    "Optional dependency '@walletpass/pass-js' not installed — Apple Wallet functionality disabled.",
  );
}

const APPLE_WALLET_WEBSERVICE_PATH = process.env.APPLE_WALLET_WEBSERVICE_PATH || '/rest/apple-wallet';

const DEFAULT_TEMPLATE_CONFIG = {
  description: 'Unchained Event Ticket',
  organizationName: 'Unchained commerce',
  passTypeIdentifier: 'pass.zuerich.gastro.event',
  teamIdentifier: process.env.PASS_TEAM_ID,
  backgroundColor: 'rgb(255,255,255)',
  labelColor: 'rgb(150,150,150)',
  foregroundColor: 'rgb(50,50,50)',
  sharingProhibited: false,
  maxDistance: 200,
  semantics: {
    eventType: 'PKEventTypeLivePerformance',
    silenceRequested: true,
  },
} as const;

const DEFAULT_PASS_CONFIG: PassConfig = {
  serialNumber: undefined,
  barcodes: [],
  voided: false,
  headerFields: [],
  primaryFields: [],
  secondaryFields: [],
  backFields: [],
  authenticationToken: undefined,
  webServiceURL: undefined,
  logoText: undefined,
} as const;

const safeMerge = <T extends object>(base: T, overrides?: Partial<T>): T => {
  if (!overrides) return base;
  const result: any = { ...base };
  for (const key of Object.keys(overrides)) {
    const value = (overrides as any)[key];
    if (value !== undefined) result[key] = value;
  }
  return result;
};

let cachedTemplate: any = null;

const buildTemplate = async (
  overrides?: Partial<typeof DEFAULT_TEMPLATE_CONFIG>,
  imageOverrides?: { icon?: string; logo?: string },
  locations?: { lat: number; lon: number; msg: string }[],
) => {
  if (!Template)
    throw new Error("Cannot generate Apple Wallet pass — '@walletpass/pass-js' not installed.");
  if (cachedTemplate) return cachedTemplate;

  const config = safeMerge(DEFAULT_TEMPLATE_CONFIG, overrides);
  const template = new Template('eventTicket', config, undefined, undefined, {
    allowHttp: process.env.NODE_ENV !== 'production',
  });

  if (Array.isArray(locations) && locations.length > 0) {
    for (const loc of locations) {
      template.addLocation({ latitude: loc.lat, longitude: loc.lon }, loc.msg);
    }
  } else {
    template.addLocation(
      { latitude: 8.8280243, longitude: 47.2664804 },
      'Barcode für Eintrittskontrolle öffnen',
    );
  }

  if (process.env.PASS_CERTIFICATE_PATH) {
    await template.loadCertificate(
      process.env.PASS_CERTIFICATE_PATH,
      process.env.PASS_CERTIFICATE_SECRET,
    );
  }

  const iconPath =
    imageOverrides?.icon ?? new URL(import.meta.resolve('../../static/icon@2x.png')).pathname;
  const logoPath =
    imageOverrides?.logo ?? new URL(import.meta.resolve('../../static/icon@2x.png')).pathname;

  await template.images.add('icon', iconPath);
  await template.images.add('icon', iconPath, '2x');
  await template.images.add('icon', iconPath, '3x');
  await template.images.add('logo', logoPath);
  await template.images.add('logo', logoPath, '2x');
  await template.images.add('logo', logoPath, '3x');

  cachedTemplate = template;
  return template;
};

export default function configureAppleWalletPass({
  templateOverrides,
  passOverrides,
  images,
  locations,
}: {
  templateOverrides?: Partial<typeof DEFAULT_TEMPLATE_CONFIG>;
  passOverrides?: Partial<typeof DEFAULT_PASS_CONFIG>;
  images?: { icon?: string; logo?: string };
  locations?: { lat: number; lon: number; msg: string }[];
} = {}) {
  return async (
    token: any,
    unchainedAPI: UnchainedCore & {
      locale?: { language: string };
      user: { lastLogin?: { locale: string } };
    },
  ) => {
    if (!Template)
      throw new Error("Cannot generate Apple Wallet pass — '@walletpass/pass-js' not installed.");

    const normalizedUserLocale = unchainedAPI?.user?.lastLogin?.locale || unchainedAPI?.locale?.language;
    const hash = await unchainedAPI.modules.warehousing.buildAccessKeyForToken(token._id);
    const voided = Boolean(token.invalidatedDate);

    const product = await unchainedAPI.modules.products.findProduct({ productId: token.productId });
    const productTexts = await unchainedAPI.modules.products.texts.findLocalizedText({
      productId: token.productId,
      locale: normalizedUserLocale as any,
    });

    const barcodeUrl = `unchained://ticket/${token._id}?hash=${hash}`;

    const template = await buildTemplate(templateOverrides, images, locations);

    const passConfig = safeMerge(DEFAULT_PASS_CONFIG, {
      serialNumber: hash,
      logoText: template.organizationName,
      voided,
      authenticationToken: token._id,
      webServiceURL: `${process.env.ROOT_URL}${APPLE_WALLET_WEBSERVICE_PATH}`,
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: barcodeUrl,
          messageEncoding: 'iso-8859-1',
          altText: token._id,
        },
      ],
      ...passOverrides,
    });

    const pass: typeof Pass = await template.createPass(passConfig as any);

    const rawSlot = product?.meta?.slot || product?.tokenization?.ercMetadataProperties?.slot;
    const slot = rawSlot ? new Date(rawSlot) : null;

    if (slot) {
      pass.relevantDate = slot;
      pass.expirationDate = new Date(slot.getTime() + 5 * 60 * 60 * 1000);
      pass.headerFields.add({
        key: 'slot',
        label: slot.toLocaleDateString(normalizedUserLocale || 'de-CH'),
        value: slot,
        dateStyle: constants.dateTimeFormat.NONE,
        timeStyle: constants.dateTimeFormat.SHORT,
        changeMessage: 'Neuer Start der Veranstaltung: %@.',
      });
    }

    pass.primaryFields.add({ key: 'title', label: 'Veranstaltung', value: productTexts.title });
    pass.secondaryFields.add({
      key: 'category',
      label: 'Location',
      value: product?.meta?.location || productTexts?.subtitle,
    });
    pass.secondaryFields.add({ key: 'tokenId', label: 'Ticketnummer', value: token.chainTokenId });
    pass.backFields.add({ key: 'description', label: 'Infos', value: productTexts.description });

    return pass;
  };
}
