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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { emitEvent, registerEvents } from 'unchained-core-events';
import { BookmarksCollection } from '../db/BookmarksCollection';
var BOOKMARK_EVENTS = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];
export var configureBookmarksModule = function (_a) {
    var db = _a.db;
    return __awaiter(void 0, void 0, void 0, function () {
        var Bookmarks;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    registerEvents(BOOKMARK_EVENTS);
                    return [4 /*yield*/, BookmarksCollection(db)];
                case 1:
                    Bookmarks = _b.sent();
                    return [2 /*return*/, {
                            findByUserId: function (userId) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Bookmarks.find({ userId: userId }).fetch()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); },
                            findByUserIdAndProductId: function (_a) {
                                var userId = _a.userId, productId = _a.productId;
                                return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, Bookmarks.findOne({ userId: userId, productId: productId })];
                                        case 1: return [2 /*return*/, _b.sent()];
                                    }
                                }); });
                            },
                            findById: function (bookmarkId) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Bookmarks.findOne({ _id: bookmarkId })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); },
                            find: function (query) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Bookmarks.find(query).fetch()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); },
                            replaceUserId: function (fromUserId, toUserId) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, Bookmarks.update({ userId: fromUserId }, {
                                                $set: {
                                                    userId: toUserId
                                                }
                                            }, {
                                                multi: true
                                            })];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); },
                            removeById: function (bookmarkId) { return __awaiter(void 0, void 0, void 0, function () {
                                var result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, Bookmarks.remove({ _id: bookmarkId })];
                                        case 1:
                                            result = _a.sent();
                                            emitEvent('BOOKMARK_REMOVE', { bookmarkId: bookmarkId });
                                            return [2 /*return*/, result];
                                    }
                                });
                            }); },
                            create: function (_a) { return __awaiter(void 0, void 0, void 0, function () {
                                var bookmarkId;
                                var userId = _a.userId, productId = _a.productId, rest = __rest(_a, ["userId", "productId"]);
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, Bookmarks.insert(__assign(__assign({}, rest), { created: new Date(), userId: userId, productId: productId }))];
                                        case 1:
                                            bookmarkId = _b.sent();
                                            emitEvent('BOOKMARK_CREATE', { bookmarkId: bookmarkId });
                                            return [2 /*return*/, bookmarkId];
                                    }
                                });
                            }); },
                            existsByUserIdAndProductId: function (_a) {
                                var productId = _a.productId, userId = _a.userId;
                                return __awaiter(void 0, void 0, void 0, function () {
                                    var selector, bookmarkCount;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                selector = {};
                                                if (productId && userId) {
                                                    selector = { userId: userId, productId: productId };
                                                }
                                                else if (userId) {
                                                    selector = { userId: userId };
                                                }
                                                return [4 /*yield*/, Bookmarks.find(selector, {
                                                        limit: 1
                                                    }).count()];
                                            case 1:
                                                bookmarkCount = _b.sent();
                                                return [2 /*return*/, !!bookmarkCount];
                                        }
                                    });
                                });
                            }
                        }];
            }
        });
    });
};
//# sourceMappingURL=configureBookmarksModule.js.map