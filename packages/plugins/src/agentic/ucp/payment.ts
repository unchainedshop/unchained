import type { PaymentProvider } from '@unchainedshop/core-payment';
import type { Order } from '@unchainedshop/core-orders';
import type { UcpRequest } from './http.ts';

export interface UcpPaymentHandler {
  name: string;
  version: string;
  spec: string;
  instrumentType: string;
  adapterKeys: string[];
  paymentContext?: (instrument: Record<string, any>) => Record<string, unknown>;
  actionOrigins?: string[];
}

export const invoiceHandler: UcpPaymentHandler = {
  name: 'shop.unchained.payment.invoice',
  version: '2026-10-20',
  spec: 'https://docs.unchained.shop/ai-integration/ucp#payment',
  instrumentType: 'invoice',
  adapterKeys: ['shop.unchained.invoice', 'shop.unchained.invoice-prepaid'],
};

export interface ExecutableHandler {
  handler: UcpPaymentHandler;
  provider: PaymentProvider;
}

export const configuredHandlers = ({ paymentHandlers }: UcpRequest['options']) =>
  paymentHandlers ?? [invoiceHandler];

export const handlersFor = (handlers: UcpPaymentHandler[], providers: PaymentProvider[]) =>
  providers.flatMap((provider) =>
    handlers
      .filter(({ adapterKeys }) => adapterKeys.includes(provider.adapterKey))
      .map((handler) => ({ handler, provider })),
  );

export async function executableHandlers({ context, profile, options }: UcpRequest, order: Order) {
  const handlers = configuredHandlers(options).filter(({ name }) => profile.ucp.payment_handlers[name]);
  if (!handlers.length) return [];
  return handlersFor(handlers, await context.services.orders.supportedPaymentProviders({ order }));
}

export const handlerDeclarations = (executable: ExecutableHandler[]) =>
  executable.reduce<Record<string, Record<string, unknown>[]>>(
    (declarations, { handler, provider }) => ({
      ...declarations,
      [handler.name]: [
        ...(declarations[handler.name] ?? []),
        {
          id: provider._id,
          version: handler.version,
          spec: handler.spec,
          available_instruments: [{ type: handler.instrumentType }],
        },
      ],
    }),
    {},
  );
