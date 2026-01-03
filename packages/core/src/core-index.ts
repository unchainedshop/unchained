import type { DrizzleDb } from '@unchainedshop/store';
import initServices, { type CustomServices, type Services } from './services/index.ts';
import initModules, { type Modules, type ModuleOptions } from './modules.ts';
import createBulkImporterFactory, {
  type BulkImporter,
  type BulkImportHandler,
} from './bulk-importer/index.ts';

// Re-export types that plugins need
export type { Modules, ModuleOptions } from './modules.ts';
export type { Services, CustomServices } from './services/index.ts';

import {
  WorkerDirector,
  DeliveryDirector,
  DeliveryPricingDirector,
  EnrollmentDirector,
  FilterDirector,
  OrderDiscountDirector,
  OrderPricingDirector,
  PaymentDirector,
  PaymentPricingDirector,
  ProductDiscountDirector,
  ProductPricingDirector,
  QuotationDirector,
  WarehousingDirector,
} from './directors/index.ts';
import type { IBaseAdapter } from '@unchainedshop/utils';

export * from './bulk-importer/index.ts';
export * from './services/index.ts';
export * from './directors/index.ts';
export * from './factory/index.ts';
export { default as schedule, type ScheduleData } from './utils/schedule.ts';

export interface UnchainedCoreOptions {
  drizzleDb?: DrizzleDb;
  bulkImporter?: {
    handlers?: Record<string, BulkImportHandler<UnchainedCore>>;
  };
  modules?: Record<
    string,
    {
      configure: (params: { db: DrizzleDb; options?: ModuleOptions }) => any;
    }
  >;
  services?: CustomServices;
  options?: ModuleOptions;
}

export interface UnchainedCore {
  modules: Modules;
  services: Services;
  bulkImporter: BulkImporter;
  options: ModuleOptions;
  db: DrizzleDb;
}

export const initCore = async ({
  drizzleDb,
  bulkImporter: bulkImporterOptions = {},
  modules: customModules = {},
  services: customServices = {},
  options = {},
}: UnchainedCoreOptions): Promise<UnchainedCore> => {
  const bulkImporter = createBulkImporterFactory(bulkImporterOptions);
  const { modules, db } = await initModules({ options, drizzleDb }, customModules);
  const services = initServices(modules, customServices);

  return {
    modules,
    services,
    bulkImporter,
    options,
    db,
  };
};

export const getAllAdapters = () => {
  const worker = WorkerDirector.getAdapters();
  const delivery = DeliveryDirector.getAdapters();
  const deliveryPricing = DeliveryPricingDirector.getAdapters();
  const enrollment = EnrollmentDirector.getAdapters();
  const filter = FilterDirector.getAdapters();
  const orderDiscount = OrderDiscountDirector.getAdapters();
  const orderPricing = OrderPricingDirector.getAdapters();
  const payment = PaymentDirector.getAdapters();
  const paymentPricing = PaymentPricingDirector.getAdapters();
  const productDiscount = ProductDiscountDirector.getAdapters();
  const productPricing = ProductPricingDirector.getAdapters();
  const quotation = QuotationDirector.getAdapters();
  const warehousing = WarehousingDirector.getAdapters();

  return ([] as IBaseAdapter[]).concat(
    worker,
    delivery,
    deliveryPricing,
    enrollment,
    filter,
    orderDiscount,
    orderPricing,
    payment,
    paymentPricing,
    productDiscount,
    productPricing,
    quotation,
    warehousing,
  );
};
