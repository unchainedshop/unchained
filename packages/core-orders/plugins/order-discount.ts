import { IOrderPricingAdapter, OrderPricingRowCategory } from '@unchainedshop/types/orders.pricing';
import { OrderPricingDirector, OrderPricingAdapter } from 'meteor/unchained:core-orders';

const resolveRatioAndTaxDivisorForPricingSheet = (pricing, total) => {
  if (total === 0 || !pricing) {
    return {
      ratio: 1,
      taxDivisor: 1,
    };
  }
  const tax = pricing.taxSum();
  const gross = pricing.gross();
  if (gross - tax === 0) {
    return {
      ratio: 0,
      taxDivisor: 0,
    };
  }
  return {
    ratio: gross / total,
    taxDivisor: gross / (gross - tax),
  };
};

const resolveAmountAndTax = ({ ratio, taxDivisor }, amount) => {
  const shareAmount = Number.isFinite(ratio) ? amount * ratio : 0;
  const shareTaxAmount =
    Number.isFinite(taxDivisor) && taxDivisor !== 0 ? shareAmount - shareAmount / taxDivisor : 0;
  return [shareAmount, shareTaxAmount];
};

const applyDiscountToMultipleShares = (shares, amount) => {
  return shares.reduce(
    ([currentDiscountAmount, currentTaxAmount], share) => {
      const [shareAmount, shareTaxAmount] = resolveAmountAndTax(share, amount);
      return [currentDiscountAmount + shareAmount, currentTaxAmount + shareTaxAmount];
    },
    [0, 0],
  );
};

const calculateAmountToSplit = (configuration, amount) => {
  const deductionAmount = configuration.rate ? amount * configuration.rate : configuration.fixedRate;

  const leftInDiscount = Math.max(0, deductionAmount - (configuration.alreadyDeductedForDiscount || 0));
  const leftToDeduct = Math.min(configuration.amountLeft, leftInDiscount);
  return Math.max(0, leftToDeduct);
};

const OrderDiscount: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-discount',
  version: '1.0',
  label: 'Apply Discounts on Total Order Value',
  orderIndex: 90,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderDelivery, orderPositions, orderPayment, modules } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // discounts need to provide a *fixedRate*
        // if you want to add percentual discounts,
        // add it to the order item calculation
        const totalAmountOfItems = pricingAdapter.calculationSheet().sum({
          category: OrderPricingRowCategory.Items,
        });
        const totalAmountOfPaymentAndDelivery =
          pricingAdapter.calculationSheet().sum({
            category: OrderPricingRowCategory.Payment,
          }) +
          pricingAdapter.calculationSheet().sum({
            category: OrderPricingRowCategory.Delivery,
          });

        const itemShares = orderPositions.map((orderPosition) =>
          resolveRatioAndTaxDivisorForPricingSheet(
            modules.orders.positions.pricingSheet(orderPosition, order.currency, params.context),
            totalAmountOfItems,
          ),
        );

        const deliveryShare = resolveRatioAndTaxDivisorForPricingSheet(
          orderDelivery &&
            modules.orders.deliveries.pricingSheet(orderDelivery, order.currency, params.context),
          totalAmountOfPaymentAndDelivery,
        );
        const paymentShare = resolveRatioAndTaxDivisorForPricingSheet(
          orderPayment &&
            modules.orders.payments.pricingSheet(orderPayment, order.currency, params.context),
          totalAmountOfPaymentAndDelivery,
        );

        let amountLeft = totalAmountOfPaymentAndDelivery + totalAmountOfItems;

        params.discounts.forEach(({ configuration, discountId }) => {
          // First, we deduce the discount from the items
          let alreadyDeductedForDiscount = 0;
          const [itemsDiscountAmount, itemsTaxAmount] = applyDiscountToMultipleShares(
            itemShares,
            calculateAmountToSplit(
              { ...configuration, amountLeft, alreadyDeductedForDiscount },
              totalAmountOfItems,
            ),
          );
          amountLeft -= itemsDiscountAmount;
          alreadyDeductedForDiscount += itemsDiscountAmount;

          // After the items, we deduct the remaining discount from payment & delivery fees
          const [deliveryAndPaymentDiscountAmount, deliveryAndPaymentTaxAmount] =
            applyDiscountToMultipleShares(
              [deliveryShare, paymentShare],
              calculateAmountToSplit(
                { ...configuration, amountLeft, alreadyDeductedForDiscount },
                totalAmountOfPaymentAndDelivery,
              ),
            );
          amountLeft -= deliveryAndPaymentDiscountAmount;
          alreadyDeductedForDiscount += itemsDiscountAmount;

          const discountAmount = itemsDiscountAmount + deliveryAndPaymentDiscountAmount;
          const taxAmount = itemsTaxAmount + deliveryAndPaymentTaxAmount;

          if (discountAmount) {
            pricingAdapter.resultSheet().addDiscounts({
              amount: discountAmount * -1,
              discountId,
              meta: {
                adapter: OrderDiscount.key,
              },
            });
            if (taxAmount !== 0) {
              pricingAdapter.resultSheet().addTaxes({
                amount: taxAmount * -1,
                meta: {
                  discountId,
                  adapter: OrderDiscount.key,
                },
              });
            }
          }
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderDiscount);
