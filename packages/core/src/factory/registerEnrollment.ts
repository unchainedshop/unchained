import type {
  EnrollmentOrderPositionTemplate,
  EnrollmentPeriod,
  EnrollmentPlan,
} from '@unchainedshop/core-enrollments';
import type { ProductPlan } from '@unchainedshop/core-products';
import type { OrderPosition } from '@unchainedshop/core-orders';
import {
  EnrollmentAdapter,
  type EnrollmentContext,
  type IPlugin,
  type IEnrollmentAdapter,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerEnrollment({
  adapterId,
  isActivatedFor,
  transformOrderItem,
  configurationForOrder,
  isOverdue,
  isValidForActivation,
  nextPeriod,
}: {
  adapterId: string;
  isActivatedFor?: (productPlan?: ProductPlan) => boolean;
  transformOrderItem?: (orderPosition: OrderPosition, unchainedAPI) => Promise<EnrollmentPlan>;
  configurationForOrder: (
    params: { period: EnrollmentPeriod },
    context: EnrollmentContext,
  ) => Promise<{
    orderContext?: Record<string, any>;
    orderPositionTemplates: EnrollmentOrderPositionTemplate[];
  } | null>;
  isOverdue?: (context: EnrollmentContext) => Promise<boolean>;
  isValidForActivation?: (context: EnrollmentContext) => Promise<boolean>;
  nextPeriod?: (context: EnrollmentContext) => Promise<EnrollmentPeriod | null>;
}): IPlugin {
  const adapter: IEnrollmentAdapter = {
    ...EnrollmentAdapter,

    key: `shop.unchained.enrollment.${adapterId}`,
    label: 'Enrollment: ' + adapterId,
    version: '1.0.0',

    isActivatedFor: (productPlan) => {
      return isActivatedFor ? isActivatedFor(productPlan) : true;
    },

    transformOrderItemToEnrollmentPlan: async (orderPosition, unchainedAPI) => {
      return transformOrderItem
        ? transformOrderItem(orderPosition, unchainedAPI)
        : EnrollmentAdapter.transformOrderItemToEnrollmentPlan(orderPosition, unchainedAPI);
    },

    actions: (context) => {
      return {
        ...EnrollmentAdapter.actions(context),

        configurationForOrder: async (params) => {
          return configurationForOrder(params, context);
        },

        isOverdue: async () => {
          return isOverdue ? isOverdue(context) : false;
        },

        isValidForActivation: async () => {
          return isValidForActivation ? isValidForActivation(context) : false;
        },

        nextPeriod: async () => {
          return nextPeriod
            ? nextPeriod(context)
            : EnrollmentAdapter.actions(context).nextPeriod();
        },
      };
    },
  };

  const plugin: IPlugin = {
    key: adapter.key,
    label: adapter.label,
    version: adapter.version,
    adapters: [adapter],
  };

  pluginRegistry.register(plugin);
  return plugin;
}
