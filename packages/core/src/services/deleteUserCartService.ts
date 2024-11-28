import { UnchainedCore } from '../core-index.js';

const deleteUserCartService = async (
    userId: string,
    unchainedAPI: UnchainedCore & { countryContext?: string },
) => {
    try {
        const user = await unchainedAPI.modules.users.findUserById(userId);
        const userCart = await unchainedAPI.modules.orders.cart({
            userId,
            countryContext: unchainedAPI?.countryContext || user?.lastLogin?.countryCode,
        });
        await unchainedAPI.modules.orders.delete(userCart?._id);
        await unchainedAPI.modules.orders.payments.deleteOrderPayment(userCart?._id);
        await unchainedAPI.modules.orders.deliveries.deleteOrderDelivery(userCart?._id);
        await unchainedAPI.modules.orders.discounts.deleteOrderDiscounts(userCart?._id);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export default deleteUserCartService;
