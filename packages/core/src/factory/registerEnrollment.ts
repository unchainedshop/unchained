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
  terminationDate,
  expiryDate,
  minimumCommitmentEnd,
  initialPeriods,
  transformPlanToNewPlan,
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
  nextPeriod?: (
    context: EnrollmentContext,
    params?: { referenceDate?: Date },
  ) => Promise<EnrollmentPeriod | null>;
  terminationDate?: (
    context: EnrollmentContext,
    params: { referenceDate: Date },
  ) => Promise<Date | null>;
  expiryDate?: (context: EnrollmentContext) => Promise<Date | null>;
  minimumCommitmentEnd?: (
    context: EnrollmentContext,
    params: { referenceDate: Date },
  ) => Promise<Date | null>;
  initialPeriods?: (
    context: EnrollmentContext,
    params: { referenceDate: Date },
  ) => Promise<EnrollmentPeriod[]>;
  transformPlanToNewPlan?: (
    context: EnrollmentContext,
    params: { plan: EnrollmentPlan; referenceDate: Date },
  ) => Promise<{ plan: EnrollmentPlan; effectiveDate: Date } | null>;
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
      const base = EnrollmentAdapter.actions(context);
      return {
        ...base,
        configurationForOrder: (params) => configurationForOrder(params, context),
        isOverdue: () => (isOverdue ? isOverdue(context) : base.isOverdue()),
        isValidForActivation: () =>
          isValidForActivation ? isValidForActivation(context) : base.isValidForActivation(),
        nextPeriod: (params) => (nextPeriod ? nextPeriod(context, params) : base.nextPeriod(params)),
        terminationDate: (params) =>
          terminationDate ? terminationDate(context, params) : base.terminationDate(params),
        expiryDate: () => (expiryDate ? expiryDate(context) : base.expiryDate()),
        minimumCommitmentEnd: (params) =>
          minimumCommitmentEnd
            ? minimumCommitmentEnd(context, params)
            : base.minimumCommitmentEnd(params),
        transformPlanToNewPlan: (params) =>
          transformPlanToNewPlan
            ? transformPlanToNewPlan(context, params)
            : base.transformPlanToNewPlan(params),
        // The base initialPeriods delegates to this object's nextPeriod, so it is only replaced when provided.
        ...(initialPeriods && { initialPeriods: (params) => initialPeriods(context, params) }),
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
