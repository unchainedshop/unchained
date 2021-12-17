import { Context } from "@unchainedshop/types/api";

export default {
  async provider({ deliveryProviderId }, _, { modules }: Context) {
    return await modules.delivery.findProvider({ deliveryProviderId });
  },
};
