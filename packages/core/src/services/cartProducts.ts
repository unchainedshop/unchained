import { ordersSettings, type Order, type OrderPosition } from '@unchainedshop/core-orders';
import type { Product } from '@unchainedshop/core-products';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';
import { updateCalculationService } from './updateCalculation.ts';

export interface CartProductInput {
  productId: string;
  quantity: number;
  configuration?: { key: string; value: string }[];
}

export interface CartProductContext {
  localeContext: Intl.Locale;
  userId?: string;
  countryCode?: string;
}

interface PreparedCartProduct extends CartProductInput {
  originalProductId: string;
  product: Product;
}

const productKey = ({
  originalProductId,
  productId,
  configuration,
}: Pick<PreparedCartProduct, 'originalProductId' | 'productId' | 'configuration'>) =>
  JSON.stringify([originalProductId, productId, configuration ?? null]);

const findCart = async (modules: Modules, orderId: string) => {
  const order = await modules.orders.findOrder({ orderId });
  if (!order) {
    throw createServiceError('OrderNotFoundError', 'Order not found', { orderId });
  }
  if (!modules.orders.isCart(order)) {
    throw createServiceError('OrderWrongStatusError', 'Order is not a cart', {
      orderId,
      status: order.status,
    });
  }
  return order;
};

const resolveCartProducts = async (modules: Modules, items: CartProductInput[]) =>
  Promise.all(
    items.map(async ({ productId, quantity, configuration }) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw createServiceError('InvalidQuantityError', `Invalid quantity for product: ${productId}`, {
          productId,
          quantity,
        });
      }

      const originalProduct = await modules.products.findProduct({ productId });
      if (!originalProduct) {
        throw createServiceError('ProductNotFoundError', `Product not found: ${productId}`, {
          productId,
        });
      }
      const product = await modules.products.resolveOrderableProduct(originalProduct, {
        configuration,
      });
      return {
        quantity,
        configuration,
        originalProductId: originalProduct._id,
        productId: product._id,
        product,
      };
    }),
  );

const aggregateCartProducts = (items: PreparedCartProduct[]) => {
  const products = new Map<string, PreparedCartProduct>();
  for (const item of items) {
    const key = productKey(item);
    const existing = products.get(key);
    if (existing) {
      const quantity = existing.quantity + item.quantity;
      if (!Number.isSafeInteger(quantity)) {
        throw createServiceError(
          'InvalidQuantityError',
          `Invalid quantity for product: ${item.originalProductId}`,
          { productId: item.originalProductId, quantity },
        );
      }
      existing.quantity = quantity;
    } else products.set(key, { ...item });
  }
  return [...products.values()];
};

const toOrderPositionInput = ({
  originalProductId,
  productId,
  quantity,
  configuration,
}: PreparedCartProduct) => ({ originalProductId, productId, quantity, configuration });

const validateCartProducts = async (
  modules: Modules,
  order: Order,
  items: PreparedCartProduct[],
  context: CartProductContext,
  existingQuantities: Map<string, number> = new Map(),
) => {
  await Promise.all(
    items.map(({ product, quantity, configuration, ...item }) =>
      ordersSettings.validateOrderPosition(
        {
          order,
          product,
          configuration,
          quantityDiff: quantity - (existingQuantities.get(productKey(item)) || 0),
        },
        { modules, ...context },
      ),
    ),
  );
};

const addCartProducts = async (
  modules: Modules,
  {
    orderId,
    items,
    context,
  }: {
    orderId: string;
    items: CartProductInput[];
    context: CartProductContext;
  },
) => {
  const order = await findCart(modules, orderId);
  const preparedItems = aggregateCartProducts(await resolveCartProducts(modules, items));
  await validateCartProducts(modules, order, preparedItems, context);

  // Sequential writes ensure duplicate selectors cannot race each other's upserts.
  const positions: OrderPosition[] = [];
  for (const item of preparedItems) {
    positions.push(
      await modules.orders.positions.addProductItem({
        ...toOrderPositionInput(item),
        orderId: order._id,
      }),
    );
  }
  const updatedOrder = await updateCalculationService.bind(modules)(orderId);
  return { order: updatedOrder, positions };
};

export async function addCartProductService(
  this: Modules,
  params: {
    orderId: string;
    item: CartProductInput;
    context: CartProductContext;
  },
): Promise<OrderPosition> {
  const { positions } = await addCartProducts(this, {
    orderId: params.orderId,
    items: [params.item],
    context: params.context,
  });
  const position = positions[0];
  return (await this.orders.positions.findOrderPosition({ itemId: position._id })) || position;
}

export async function addMultipleCartProductsService(
  this: Modules,
  params: {
    orderId: string;
    items: CartProductInput[];
    context: CartProductContext;
  },
): Promise<Order> {
  const { order } = await addCartProducts(this, params);
  return order;
}

export async function replaceCartProductsService(
  this: Modules,
  {
    orderId,
    items,
    context,
  }: {
    orderId: string;
    items: CartProductInput[];
    context: CartProductContext;
  },
): Promise<Order> {
  const order = await findCart(this, orderId);
  const preparedItems = aggregateCartProducts(await resolveCartProducts(this, items));
  const existingPositions = await this.orders.positions.findOrderPositions({ orderId });
  const existingQuantities = new Map<string, number>();
  for (const position of existingPositions) {
    const key = productKey({
      originalProductId: position.originalProductId,
      productId: position.productId,
      configuration: position.configuration || undefined,
    });
    existingQuantities.set(key, (existingQuantities.get(key) || 0) + position.quantity);
  }
  await validateCartProducts(this, order, preparedItems, context, existingQuantities);

  await this.orders.positions.replaceProductItems({
    orderId,
    items: preparedItems.map(toOrderPositionInput),
  });
  return updateCalculationService.bind(this)(orderId);
}

export async function updateCartProductService(
  this: Modules,
  {
    itemId,
    quantity,
    configuration,
    context,
  }: {
    itemId: string;
    quantity?: number | null;
    configuration?: { key: string; value: string }[] | null;
    context: CartProductContext;
  },
): Promise<OrderPosition> {
  const item = await this.orders.positions.findOrderPosition({ itemId });
  if (!item) {
    throw createServiceError('OrderItemNotFoundError', 'Order item not found', { itemId });
  }
  const order = await findCart(this, item.orderId);
  const nextQuantity = quantity ?? item.quantity;
  if (!Number.isSafeInteger(nextQuantity) || nextQuantity < 1) {
    throw createServiceError('InvalidQuantityError', 'Invalid order item quantity', {
      itemId,
      quantity: nextQuantity,
    });
  }
  const product = await this.products.findProduct({ productId: item.productId });
  if (!product) {
    throw createServiceError('ProductNotFoundError', `Product not found: ${item.productId}`, {
      productId: item.productId,
    });
  }
  await ordersSettings.validateOrderPosition(
    {
      order,
      product,
      configuration: configuration ?? item.configuration,
      quantityDiff: nextQuantity - item.quantity,
    },
    { modules: this, ...context },
  );

  const updated = await this.orders.positions.updateProductItem({
    orderPositionId: item._id,
    quantity: quantity == null ? null : quantity,
    configuration: configuration == null ? null : configuration,
  });
  if (!updated) {
    throw createServiceError('OrderItemNotFoundError', 'Order item not found', { itemId });
  }
  await updateCalculationService.bind(this)(order._id);
  return (await this.orders.positions.findOrderPosition({ itemId })) || updated;
}
