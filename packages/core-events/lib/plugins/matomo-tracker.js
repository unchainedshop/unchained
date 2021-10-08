var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/* eslint-disable camelcase */
import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { Orders } from 'meteor/unchained:core-orders';
import { subscribe } from 'meteor/unchained:core-events';
var parseCurrency = function (amount) {
    return parseFloat((amount / 100).toString());
};
var actionMap = {
    ORDER_ADD_PRODUCT: 'addEcommerceItem',
    ORDER_UPDATE_CART_ITEM: 'addEcommerceItem',
    ORDER_REMOVE_CART_ITEM: 'addEcommerceItem',
    ORDER_CHECKOUT: 'trackEcommerceOrder'
};
var extractOrderParameters = function (orderId) {
    var order = Orders.findOrder({ orderId: orderId });
    var pricing = order.pricing();
    var orderOptions = {
        idgoal: 0,
        _ects: new Date().getTime(),
        uid: order.userId,
        _id: order.userId,
        revenue: parseCurrency(order.pricing().total().amount),
        ec_tx: parseCurrency(pricing.taxSum()),
        ec_dt: pricing.discountSum(),
        ec_items: JSON.stringify(order
            .items()
            .map(function (item) {
            var _a, _b, _c, _d;
            return [
                "" + ((_b = (_a = item.product()) === null || _a === void 0 ? void 0 : _a.warehousing) === null || _b === void 0 ? void 0 : _b.sku),
                (_d = (_c = item.product()) === null || _c === void 0 ? void 0 : _c.getLocalizedTexts()) === null || _d === void 0 ? void 0 : _d.title,
                '',
                parseCurrency(item.pricing().unitPrice().amount),
                item.quantity,
            ];
        }))
    };
    if (!order.isCart()) {
        orderOptions.ec_id = order._id;
    }
    return orderOptions;
};
var MatomoTracker = function (siteId, siteUrl, subscribeTo, options) {
    if (!siteId && typeof siteId !== 'number')
        throw new Error('Matomo siteId is required');
    if (!siteUrl && typeof siteUrl !== 'string')
        throw new Error('Matomo tracker URL is required');
    if (!subscribeTo && typeof subscribeTo !== 'string')
        throw new Error('Event that triggers tracking should be provided');
    subscribe(subscribeTo, function (_a) {
        var payload = _a.payload, context = _a.context;
        return __awaiter(void 0, void 0, void 0, function () {
            var matomoOptions;
            var _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        matomoOptions = {};
                        if ((payload === null || payload === void 0 ? void 0 : payload.order) || (payload === null || payload === void 0 ? void 0 : payload.orderPosition))
                            matomoOptions = extractOrderParameters(((_b = payload === null || payload === void 0 ? void 0 : payload.order) === null || _b === void 0 ? void 0 : _b._id) || ((_c = payload === null || payload === void 0 ? void 0 : payload.orderPosition) === null || _c === void 0 ? void 0 : _c.orderId));
                        matomoOptions = (options === null || options === void 0 ? void 0 : options.transform)
                            ? (_d = options === null || options === void 0 ? void 0 : options.transform(subscribeTo, matomoOptions, context)) !== null && _d !== void 0 ? _d : {}
                            : matomoOptions;
                        return [4 /*yield*/, fetch(siteUrl + "/matomo.php?idsite=" + siteId + "&rec=1&action_name=" + actionMap[subscribeTo] + "&" + encode(matomoOptions))];
                    case 1:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
};
export var initMatomo = function (siteId, url, options) {
    MatomoTracker(siteId, url, 'ORDER_CHECKOUT', options);
    MatomoTracker(siteId, url, 'ORDER_UPDATE_CART_ITEM', options);
    MatomoTracker(siteId, url, 'ORDER_ADD_PRODUCT', options);
    MatomoTracker(siteId, url, 'ORDER_REMOVE_CART_ITEM', options);
};
export default MatomoTracker;
//# sourceMappingURL=matomo-tracker.js.map