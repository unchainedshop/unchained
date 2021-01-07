import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';

export default {
    product(obj) {
        return Products.findOne({ _id: obj.productId });
    },
    user(obj) {
        return Users.findOne({ _id: obj.userId });
    },
};
