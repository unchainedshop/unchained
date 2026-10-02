import {
  type IWarehousingAdapter,
  type UnchainedCore,
  type WarehousingContext,
  WarehousingAdapter,
  WarehousingError,
  getFileAdapter,
} from '@unchainedshop/core';
import type { Order, OrderPosition } from '@unchainedshop/core-orders';
import { ProductType, type Product } from '@unchainedshop/core-products';
import {
  type TokenSurrogate,
  type WarehousingConfiguration,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { createLogger } from '@unchainedshop/logger';
import { systemLocale } from '@unchainedshop/utils';
import type { TicketingModule } from '../../module.ts';
import { getTicketEventStart, isTicketCancelled, isTicketEventCancelled } from '../../event-details.ts';
import { isWithinEntryWindow } from '../../entry-window.ts';

const logger = createLogger('unchained:ticketing');

export const TICKET_WAREHOUSING_ADAPTER_KEY = 'shop.unchained.warehousing.ticket';

export interface TicketIssuerAPI {
  modules: UnchainedCore['modules'] & TicketingModule;
}

export interface TicketMetaInput {
  order: Order;
  orderPosition: OrderPosition;
  product: Product;
  /** The seat within the order position, 0 to quantity - 1. */
  index: number;
}

export interface TicketWarehousingOptions {
  /**
   * Extra data stored in `token.meta` of each ticket when it is issued, for example the attendee
   * from the order context: return `{ attendeeName }` to show the name to gate staff
   * (`Token.attendeeName`). The data is never part of the public ERC metadata. `orderId`,
   * `cancelled` and `cancelledDate` are reserved; a failing hook is logged and ignored.
   * Without a hook, tickets carry the attendee names of the order position configuration
   * `attendees` (readAttendeeName), which the Box Office of the Admin UI writes.
   */
  ticketMeta?: (
    input: TicketMetaInput,
    unchainedAPI: TicketIssuerAPI,
  ) => Record<string, unknown> | undefined | Promise<Record<string, unknown> | undefined>;
}

/** The order position configuration key with the attendee names, one per seat, comma-separated. */
export const ATTENDEES_CONFIGURATION_KEY = 'attendees';

/**
 * The attendee name of one seat of an order position, from its configuration `attendees`
 * (e.g. `Ada Lovelace, , Alan Turing`: seats without a name stay empty).
 */
export function readAttendeeName({
  orderPosition,
  index,
}: Pick<TicketMetaInput, 'orderPosition' | 'index'>): string | undefined {
  const attendees = orderPosition.configuration?.find(
    ({ key }) => key === ATTENDEES_CONFIGURATION_KEY,
  )?.value;
  if (typeof attendees !== 'string') return undefined;
  return attendees.split(',')[index]?.trim() || undefined;
}

const defaultTicketMeta: TicketWarehousingOptions['ticketMeta'] = (input) => {
  const attendeeName = readAttendeeName(input);
  return attendeeName ? { attendeeName } : undefined;
};

const RESERVED_TICKET_META_KEYS = ['orderId', 'cancelled', 'cancelledDate'];

const ConfigurationKey = {
  ENTRY_OPENS_MINUTES_BEFORE: 'entryOpensMinutesBefore',
  ENTRY_CLOSES_MINUTES_AFTER: 'entryClosesMinutesAfter',
  SERIAL_OFFSET: 'serialOffset',
} as const;

// Provider configuration values are strings; an empty value means "not set".
const readNumber = (configuration: WarehousingConfiguration, key: string) => {
  const value = configuration?.find((entry) => entry.key === key)?.value?.trim();
  if (!value) return { value: null, valid: true };
  const number = Number(value);
  return Number.isFinite(number) ? { value: number, valid: true } : { value: null, valid: false };
};

const readTicketConfiguration = (configuration: WarehousingConfiguration) => {
  const opens = readNumber(configuration, ConfigurationKey.ENTRY_OPENS_MINUTES_BEFORE);
  const closes = readNumber(configuration, ConfigurationKey.ENTRY_CLOSES_MINUTES_AFTER);
  const offset = readNumber(configuration, ConfigurationKey.SERIAL_OFFSET);
  const serialOffsetValid = offset.valid && Number.isInteger(offset.value ?? 0);
  return {
    opensMinutesBefore: opens.value,
    closesMinutesAfter: closes.value,
    entryWindowValid: opens.valid && closes.valid,
    serialOffset: serialOffsetValid ? (offset.value ?? 0) : 0,
    serialOffsetValid,
  };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Same shape as database ids elsewhere, without depending on the database package here.
const generateTicketId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

/**
 * The ticket issuer: a VIRTUAL warehousing adapter for TOKENIZED_PRODUCT events that issues one
 * off-chain ticket per seat. Stock is shown from `tokenization.supply` minus the tickets that are
 * not cancelled (display only; validateTicketOrderPosition enforces the supply). Tickets can be
 * redeemed within the entry window around the event start, unless they or their event were
 * cancelled. Needs the passes module of createTicketingPlugin().
 */
export function createTicketWarehousingAdapter(
  options: TicketWarehousingOptions = {},
): IWarehousingAdapter {
  const { ticketMeta = defaultTicketMeta } = options;

  return {
    ...WarehousingAdapter,

    key: TICKET_WAREHOUSING_ADAPTER_KEY,
    version: '1.0.0',
    label: 'Ticket Issuer',
    orderIndex: 0,

    // Minutes around the event start in which tickets can be redeemed; empty means unbounded.
    // The serial offset only applies to events that have no numbered tickets yet.
    initialConfiguration: [
      { key: ConfigurationKey.ENTRY_OPENS_MINUTES_BEFORE, value: '120' },
      { key: ConfigurationKey.ENTRY_CLOSES_MINUTES_AFTER, value: '60' },
      { key: ConfigurationKey.SERIAL_OFFSET, value: '0' },
    ],

    typeSupported: (type) => type === WarehousingProviderType.VIRTUAL,

    actions: (configuration, context) => {
      const { product, order, orderPosition, token, locale, modules } = context as WarehousingContext &
        TicketIssuerAPI;
      const settings = readTicketConfiguration(configuration);

      const issueTicketMeta = async (index: number) => {
        if (!ticketMeta) return {};
        try {
          const extra = await ticketMeta(
            { order: order!, orderPosition: orderPosition!, product: product!, index },
            { modules },
          );
          if (!isPlainObject(extra)) return {};
          return Object.fromEntries(
            Object.entries(extra).filter(([key]) => !RESERVED_TICKET_META_KEYS.includes(key)),
          );
        } catch (error) {
          logger.error(`ticketMeta failed for order position ${orderPosition?._id}`, error);
          return {};
        }
      };

      return {
        ...WarehousingAdapter.actions(configuration, context),

        isActive() {
          return product?.type === ProductType.TOKENIZED_PRODUCT;
        },

        configurationError() {
          if (!modules?.passes?.reserveTicketSerials) {
            logger.error(
              'The ticket issuer needs the passes module, register createTicketingPlugin() as well',
            );
            return WarehousingError.INCOMPLETE_CONFIGURATION;
          }
          if (!settings.entryWindowValid || !settings.serialOffsetValid) {
            return WarehousingError.INCOMPLETE_CONFIGURATION;
          }
          return null;
        },

        stock: async () => {
          const supply = product?.tokenization?.supply;
          if (!product || !supply || !(supply > 0) || isTicketEventCancelled(product)) return 0;
          const issued = await modules.passes.countIssuedTickets(product._id, { skipCancelled: true });
          return Math.max(0, supply - issued);
        },

        async isInvalidateable(_tokenSerialNumber, referenceDate) {
          if (token?.invalidatedDate || isTicketCancelled(token) || isTicketEventCancelled(product)) {
            return false;
          }
          if (!settings.entryWindowValid) {
            logger.warn('Ticket issuer entry window is not a number of minutes, nobody gets in');
            return false;
          }
          return isWithinEntryWindow({
            start: getTicketEventStart(product),
            referenceDate: new Date(referenceDate),
            opensMinutesBefore: settings.opensMinutesBefore,
            closesMinutesAfter: settings.closesMinutesAfter,
          });
        },

        tokenize: async () => {
          if (!orderPosition || !product) {
            throw new Error('Order position not found in context');
          }
          const serials = await modules.passes.reserveTicketSerials(
            product._id,
            orderPosition.quantity,
            { offset: settings.serialOffset },
          );
          const tickets: Omit<TokenSurrogate, 'userId' | 'productId' | 'orderPositionId'>[] = [];
          for (const [index, tokenSerialNumber] of serials.entries()) {
            tickets.push({
              _id: generateTicketId(),
              tokenSerialNumber,
              quantity: 1,
              meta: { ...(await issueTicketMeta(index)), orderId: orderPosition.orderId },
            });
          }
          return tickets;
        },

        // Public (served on the ERC metadata route): only product facts, never token.meta.
        tokenMetadata: async (tokenSerialNumber) => {
          if (!product) throw new Error('Product not found in context');
          const [firstMedia] = await modules.products.media.findProductMedias({
            productId: product._id,
            limit: 1,
          });
          const file = firstMedia && (await modules.files.findFile({ fileId: firstMedia.mediaId }));
          const signedUrl = file && (await getFileAdapter()?.createDownloadURL(file));
          const image = signedUrl ? await modules.files.normalizeUrl(signedUrl, {}) : undefined;
          const text = await modules.products.texts.findLocalizedText({
            productId: product._id,
            locale: locale || systemLocale,
          });
          return {
            name: `${text?.title || product._id} #${tokenSerialNumber}`,
            description: text?.description,
            image,
            properties: product.tokenization?.ercMetadataProperties,
          };
        },
      };
    },
  };
}
