var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { SchemaFields } from 'unchained-core-mongodb-utils';
import SimpleSchema from 'simpl-schema';
export var BookmarkSchema = new SimpleSchema(__assign({ userId: { type: String, required: true }, productId: { type: String, required: true } }, SchemaFields.timestampFields), { requiredByDefault: false });
//# sourceMappingURL=BookmarksSchema.js.map