// Base preset: Essential plugins for Unchained Engine

// Import PluginRegistry for new plugin architecture
import { pluginRegistry } from '@unchainedshop/core';
import { setEmitAdapter } from '@unchainedshop/events';

// Import plugins - Files
import { GridFSPlugin } from '../files/gridfs/index.ts';
import { TempUploadPlugin } from '../files/temp-upload/index.ts';

// Import plugins - Payment
import { InvoicePlugin } from '../payment/invoice/index.ts';

// Import plugins - Delivery
import { PostPlugin } from '../delivery/post/index.ts';

// Import plugins - Warehousing
import { StorePlugin } from '../warehousing/store/index.ts';
import { ERCMetadataPlugin } from '../warehousing/erc-metadata/index.ts';

// Import plugins - Pricing
import { PaymentFreePricePlugin } from '../pricing/free-payment/index.ts';
import { DeliveryFreePricePlugin } from '../pricing/free-delivery/index.ts';
import { OrderItemsPlugin } from '../pricing/order-items/index.ts';
import { OrderDiscountPlugin } from '../pricing/order-discount/index.ts';
import { OrderDeliveryPlugin } from '../pricing/order-delivery/index.ts';
import { OrderPaymentPlugin } from '../pricing/order-payment/index.ts';
import { ProductPricePlugin } from '../pricing/product-catalog-price/index.ts';
import { ProductDiscountPlugin } from '../pricing/product-discount/index.ts';

// Import plugins - Quotations
import { ManualOfferingPlugin } from '../quotations/manual/index.ts';

// Import plugins - Enrollments
import { LicensedEnrollmentsPlugin } from '../enrollments/licensed/index.ts';

// Import adapters - Events (not yet migrated to plugin architecture)
import { NodeEventEmitter } from '../events/node-event-emitter.ts';

// Import plugins - Workers
import { BulkImportPlugin } from '../worker/bulk-import/index.ts';
import { ZombieKillerPlugin } from '../worker/zombie-killer/index.ts';
import { MessagePlugin } from '../worker/message/index.ts';
import { ExternalPlugin } from '../worker/external/index.ts';
import { HttpRequestPlugin } from '../worker/http-request/index.ts';
import { HeartbeatPlugin } from '../worker/heartbeat/index.ts';
import { EmailPlugin } from '../worker/email/index.ts';
import { ErrorNotificationsPlugin } from '../worker/error-notifications/index.ts';
import { BulkExportPlugin } from '../worker/bulk-export/index.ts';

export function registerBasePlugins() {
  // Files
  pluginRegistry.register(GridFSPlugin);
  pluginRegistry.register(TempUploadPlugin);

  // Payment
  pluginRegistry.register(InvoicePlugin);

  // Delivery
  pluginRegistry.register(PostPlugin);

  // Warehousing
  pluginRegistry.register(StorePlugin);
  pluginRegistry.register(ERCMetadataPlugin);

  // Pricing - Payment & Delivery
  pluginRegistry.register(PaymentFreePricePlugin);
  pluginRegistry.register(DeliveryFreePricePlugin);

  // Pricing - Order level
  pluginRegistry.register(OrderItemsPlugin);
  pluginRegistry.register(OrderDiscountPlugin);
  pluginRegistry.register(OrderDeliveryPlugin);
  pluginRegistry.register(OrderPaymentPlugin);

  // Pricing - Product level
  pluginRegistry.register(ProductPricePlugin);
  pluginRegistry.register(ProductDiscountPlugin);

  // Quotations
  pluginRegistry.register(ManualOfferingPlugin);

  // Enrollments
  pluginRegistry.register(LicensedEnrollmentsPlugin);

  // Events (not yet migrated to plugin architecture)
  setEmitAdapter(NodeEventEmitter());

  // Workers
  pluginRegistry.register(BulkImportPlugin);
  pluginRegistry.register(ZombieKillerPlugin);
  pluginRegistry.register(MessagePlugin);
  pluginRegistry.register(ExternalPlugin);
  pluginRegistry.register(HttpRequestPlugin);
  pluginRegistry.register(HeartbeatPlugin);
  pluginRegistry.register(EmailPlugin);
  pluginRegistry.register(ErrorNotificationsPlugin); // Auto-scheduling configured in onRegister
  pluginRegistry.register(BulkExportPlugin);
}
