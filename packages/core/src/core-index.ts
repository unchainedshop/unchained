import { type mongodb, type MigrationRepository, type ModuleInput } from '@unchainedshop/mongodb';
import initServices, { type CustomServices, type Services } from './services/index.ts';
import initModules, { type Modules, type ModuleOptions } from './modules.ts';
import createBulkImporterFactory, {
  type BulkImporter,
  type BulkImportHandler,
} from './bulk-importer/index.ts';

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

export interface UnchainedCoreOptions {
  db: mongodb.Db;
  migrationRepository: MigrationRepository<UnchainedCore>;
  bulkImporter?: {
    handlers?: Record<string, BulkImportHandler<UnchainedCore>>;
  };
  modules?: Record<
    string,
    {
      configure: (params: ModuleInput<any>) => any;
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
}

export const initCore = async ({
  db,
  migrationRepository,
  bulkImporter: bulkImporterOptions = {},
  modules: customModules = {},
  services: customServices = {},
  options = {},
}: UnchainedCoreOptions): Promise<UnchainedCore> => {
  // Configure custom modules

  const bulkImporter = createBulkImporterFactory(db, bulkImporterOptions);
  const modules = await initModules({ db, migrationRepository, options }, customModules);
  const services = initServices(modules, customServices);

  return {
    modules,
    services,
    bulkImporter,
    options,
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
