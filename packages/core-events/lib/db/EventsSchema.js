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
import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
export var EventsSchema = new SimpleSchema(__assign({ type: { type: String, required: true }, payload: { type: Object, blackbox: true }, context: { type: Object, blackbox: true } }, Schemas.timestampFields), { requiredByDefault: false });
//# sourceMappingURL=EventsSchema.js.map