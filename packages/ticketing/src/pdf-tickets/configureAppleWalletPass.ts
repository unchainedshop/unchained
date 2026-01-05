import type { UnchainedCore } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import type * as PassJsTypes from '@walletpass/pass-js';
import type { AppleWalletPassConfig, AppleWalletTemplateConfig, PassFieldLabels } from './types.js';

interface WarehousingToken {
  _id: string;
  productId: string;
  invalidatedDate?: Date;
  chainTokenId?: string;
}

const logger = createLogger('unchained:ticketing:apple-wallet');

let passJs: typeof PassJsTypes | null = null;

try {
  passJs = await import('@walletpass/pass-js');
} catch {
  logger.warn('@walletpass/pass-js not installed — Apple Wallet functionality disabled');
}

const APPLE_WALLET_WEBSERVICE_PATH = process.env.APPLE_WALLET_WEBSERVICE_PATH || '/rest/apple-wallet';

const DEFAULT_PASS_FIELD_LABELS: PassFieldLabels = {
  eventLabel: 'Event',
  locationLabel: 'Location',
  ticketNumberLabel: 'Ticket Number',
  infoLabel: 'Info',
  slotChangeMessage: 'New event start: %@.',
  barcodeHint: 'Open barcode for entry',
};

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

export interface AppleWalletPassOptions {
  templateConfig: AppleWalletTemplateConfig;
  passOverrides?: Partial<AppleWalletPassConfig>;
  images?: { icon?: string; logo?: string };
  locations?: { latitude: number; longitude: number; relevantText: string }[];
  labels?: Partial<PassFieldLabels>;
}

type TicketingContext = UnchainedCore & {
  locale?: { language: string };
  user?: { lastLogin?: { locale?: string } };
};

export default function configureAppleWalletPass({
  templateConfig,
  passOverrides,
  images,
  locations,
  labels,
}: AppleWalletPassOptions) {
  if (!passJs) {
    throw new Error("Cannot configure Apple Wallet pass — '@walletpass/pass-js' not installed");
  }

  const { Template, constants } = passJs;
  const fieldLabels = safeMerge(DEFAULT_PASS_FIELD_LABELS, labels);

  let cachedTemplate: InstanceType<typeof Template> | null = null;

  const buildTemplate = async () => {
    if (cachedTemplate) return cachedTemplate;

    const template = new Template('eventTicket', templateConfig, undefined, undefined, {
      allowHttp: process.env.NODE_ENV !== 'production',
    });

    if (locations && locations.length > 0) {
      for (const loc of locations) {
        template.addLocation({ latitude: loc.latitude, longitude: loc.longitude }, loc.relevantText);
      }
    }

    if (process.env.PASS_CERTIFICATE_PATH) {
      await template.loadCertificate(
        process.env.PASS_CERTIFICATE_PATH,
        process.env.PASS_CERTIFICATE_SECRET,
      );
    }

    const iconPath = images?.icon ?? new URL(import.meta.resolve('../../static/icon@2x.png')).pathname;
    const logoPath = images?.logo ?? new URL(import.meta.resolve('../../static/icon@2x.png')).pathname;

    await template.images.add('icon', iconPath);
    await template.images.add('icon', iconPath, '2x');
    await template.images.add('icon', iconPath, '3x');
    await template.images.add('logo', logoPath);
    await template.images.add('logo', logoPath, '2x');
    await template.images.add('logo', logoPath, '3x');

    cachedTemplate = template;
    return template;
  };

  return async (token: WarehousingToken, unchainedAPI: TicketingContext) => {
    const normalizedUserLocale =
      unchainedAPI?.user?.lastLogin?.locale || unchainedAPI?.locale?.language || 'en';
    const hash = await unchainedAPI.modules.warehousing.buildAccessKeyForToken(token._id);
    const voided = Boolean(token.invalidatedDate);

    const product = await unchainedAPI.modules.products.findProduct({ productId: token.productId });
    const productTexts = await unchainedAPI.modules.products.texts.findLocalizedText({
      productId: token.productId,
      locale: new Intl.Locale(normalizedUserLocale),
    });

    const barcodeUrl = `unchained://ticket/${token._id}?hash=${hash}`;

    const template = await buildTemplate();

    const basePassConfig: AppleWalletPassConfig = {
      serialNumber: hash || '',
      logoText: templateConfig.organizationName,
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
      headerFields: [],
      primaryFields: [],
      secondaryFields: [],
      backFields: [],
    };

    const passConfig = safeMerge(basePassConfig, passOverrides);
    const pass = await template.createPass(passConfig);

    const productMeta = product?.meta as Record<string, unknown> | undefined;
    const tokenization = product?.tokenization as Record<string, unknown> | undefined;
    const ercMetadata = tokenization?.ercMetadataProperties as Record<string, unknown> | undefined;
    const rawSlot = productMeta?.slot || ercMetadata?.slot;
    const slot = rawSlot ? new Date(rawSlot as string | number) : null;

    if (slot) {
      pass.relevantDate = slot;
      pass.expirationDate = new Date(slot.getTime() + 5 * 60 * 60 * 1000);
      pass.headerFields.add({
        key: 'slot',
        label: slot.toLocaleDateString(normalizedUserLocale),
        value: slot,
        dateStyle: constants.dateTimeFormat.NONE,
        timeStyle: constants.dateTimeFormat.SHORT,
        changeMessage: fieldLabels.slotChangeMessage,
      });
    }

    pass.primaryFields.add({
      key: 'title',
      label: fieldLabels.eventLabel,
      value: productTexts?.title || '',
    });
    pass.secondaryFields.add({
      key: 'category',
      label: fieldLabels.locationLabel,
      value: (productMeta?.location as string) || productTexts?.subtitle || '',
    });
    pass.secondaryFields.add({
      key: 'tokenId',
      label: fieldLabels.ticketNumberLabel,
      value: token.chainTokenId || '',
    });
    pass.backFields.add({
      key: 'description',
      label: fieldLabels.infoLabel,
      value: productTexts?.description || '',
    });

    return pass;
  };
}
