import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { OrderStatus } from '@unchainedshop/core-orders';
import {
  actionValidators as providerActions,
  ProviderManagementSchema,
} from '../tools/provider/schemas.ts';
import { actionValidators as orderActions, OrderManagementSchema } from '../tools/order/schemas.ts';

const domainTypes = {
  PAYMENT: PaymentProviderType,
  DELIVERY: DeliveryProviderType,
  WAREHOUSING: WarehousingProviderType,
} as const;

const createInput = (providerType: string, type: string) => ({
  providerType,
  provider: { type, adapterKey: 'test-adapter' },
});

describe('MCP provider subtype validation', () => {
  it('accepts every domain subtype for its provider category', () => {
    for (const [providerType, types] of Object.entries(domainTypes)) {
      for (const type of Object.values(types)) {
        assert.ok(providerActions.CREATE.safeParse(createInput(providerType, type)).success);
        for (const action of ['LIST', 'INTERFACES'] as const) {
          assert.ok(providerActions[action].safeParse({ providerType, typeFilter: type }).success);
        }
      }
    }
  });

  it('rejects removed CARD and LOCAL subtypes for creation and filtering', () => {
    for (const providerType of Object.keys(domainTypes)) {
      for (const type of ['CARD', 'LOCAL']) {
        assert.equal(providerActions.CREATE.safeParse(createInput(providerType, type)).success, false);
        for (const action of ['LIST', 'INTERFACES'] as const) {
          assert.equal(
            providerActions[action].safeParse({ providerType, typeFilter: type }).success,
            false,
          );
        }
      }
    }
  });

  it('rejects valid subtypes when used in another provider category', () => {
    for (const providerType of Object.keys(domainTypes)) {
      for (const [otherCategory, types] of Object.entries(domainTypes)) {
        if (otherCategory === providerType) continue;
        for (const type of Object.values(types)) {
          const created = providerActions.CREATE.safeParse(createInput(providerType, type));
          assert.equal(created.success, false, `${providerType} CREATE must reject ${type}`);
          if (!created.success) {
            assert.deepEqual(created.error.issues[0].path, ['provider', 'type']);
          }
          for (const action of ['LIST', 'INTERFACES'] as const) {
            const filtered = providerActions[action].safeParse({ providerType, typeFilter: type });
            assert.equal(filtered.success, false, `${providerType} ${action} must reject ${type}`);
            if (!filtered.success) {
              assert.deepEqual(filtered.error.issues[0].path, ['typeFilter']);
            }
          }
        }
      }
    }
  });

  it('allows an omitted subtype filter', () => {
    for (const providerType of Object.keys(domainTypes)) {
      for (const action of ['LIST', 'INTERFACES'] as const) {
        assert.ok(providerActions[action].safeParse({ providerType }).success);
      }
    }
  });

  it('advertises only supported provider subtypes to MCP clients', () => {
    const schema = (ProviderManagementSchema as any)['~standard'].jsonSchema.input();
    const expected = Object.values(domainTypes).flatMap((types) => Object.values(types));
    const advertised = schema.properties.provider.properties.type.anyOf.flatMap(
      (entry: { enum: string[] }) => entry.enum,
    );
    assert.deepEqual(advertised.toSorted(), expected.toSorted());
    const filterTypes = schema.properties.typeFilter.anyOf.flatMap(
      (entry: { enum: string[] }) => entry.enum,
    );
    assert.deepEqual(filterTypes.toSorted(), expected.toSorted());
    assert.doesNotMatch(JSON.stringify(schema), /\b(CARD|LOCAL)\b/);
  });
});

describe('MCP order filters', () => {
  it('accepts the domain payment and delivery subtypes', () => {
    const input = {
      paymentProviderTypes: Object.values(PaymentProviderType),
      deliveryProviderTypes: Object.values(DeliveryProviderType),
    };
    assert.ok(orderActions.LIST.safeParse(input).success);
  });

  it('rejects removed and cross-category provider subtypes', () => {
    for (const paymentType of ['CARD', 'LOCAL', ...Object.values(DeliveryProviderType)]) {
      assert.equal(orderActions.LIST.safeParse({ paymentProviderTypes: [paymentType] }).success, false);
    }
    for (const deliveryType of ['LOCAL', 'CARD', ...Object.values(PaymentProviderType)]) {
      assert.equal(
        orderActions.LIST.safeParse({ deliveryProviderTypes: [deliveryType] }).success,
        false,
      );
    }
  });

  it('uses domain order statuses in every shared order filter', () => {
    for (const action of ['LIST', 'SALES_SUMMARY', 'MONTHLY_BREAKDOWN'] as const) {
      assert.ok(orderActions[action].safeParse({ status: Object.values(OrderStatus) }).success);
      for (const status of ['SHIPPED', 'DELIVERED', 'CANCELLED']) {
        assert.equal(orderActions[action].safeParse({ status: [status] }).success, false);
      }
    }
  });

  it('advertises domain enums in the order management wire schema', () => {
    const schema = (OrderManagementSchema as any)['~standard'].jsonSchema.input();
    assert.deepEqual(
      schema.properties.paymentProviderTypes.items.enum,
      Object.values(PaymentProviderType),
    );
    assert.deepEqual(
      schema.properties.deliveryProviderTypes.items.enum,
      Object.values(DeliveryProviderType),
    );
    assert.deepEqual(schema.properties.status.items.enum, Object.values(OrderStatus));
  });
});
