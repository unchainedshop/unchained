import { Orders } from 'meteor/unchained:core-orders';

export default {
  interface(obj) {
    const Interface = obj.interface();
    if (!Interface) return null;
    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
    };
  },
  async simulatedPrice(obj, { orderId, useNetPrice, context }, requestContext) {
    const { countryContext, user } = requestContext;
    const order = Orders.findOne({ _id: orderId });
    return obj.orderPrice(
      {
        country: countryContext,
        order,
        useNetPrice,
        user,
        providerContext: context,
      },
      requestContext,
    );
  },
};
