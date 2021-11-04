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
import { emitEvent, registerEvents } from 'meteor/unchained:core-events';
import { generateDbFilterById, generateDbMutations, } from 'meteor/unchained:utils';
import { BookmarksCollection } from '../db/BookmarksCollection';
import { BookmarkSchema } from '../db/BookmarksSchema';
var BOOKMARK_EVENTS = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];
export var configureBookmarksModule = function (_a) {
    var db = _a.db;
    return __awaiter(void 0, void 0, void 0, function () {
        var Bookmarks, mutations;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    registerEvents(BOOKMARK_EVENTS);
                    return [4 /*yield*/, BookmarksCollection(db)];
                case 1:
                    Bookmarks = _b.sent();
                    mutations = generateDbMutations(Bookmarks, BookmarkSchema);
                    return [2 /*return*/, {
                            findByUserId: function (userId) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Bookmarks.find({ userId: userId }).toArray()];
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
                            findById: function (bookmarkId) { return __awaiter(void 0, void 0, void 0, function () {
                                var filter, bookmark;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            filter = generateDbFilterById(bookmarkId);
                                            return [4 /*yield*/, Bookmarks.findOne({ _id: filter._id })];
                                        case 1:
                                            bookmark = _a.sent();
                                            return [2 /*return*/, bookmark];
                                    }
                                });
                            }); },
                            find: function (query) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Bookmarks.find(query).toArray()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); },
                            replaceUserId: function (fromUserId, toUserId) { return __awaiter(void 0, void 0, void 0, function () {
                                var result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, Bookmarks.updateMany({ userId: fromUserId }, {
                                                $set: {
                                                    userId: toUserId
                                                }
                                            })];
                                        case 1:
                                            result = _a.sent();
                                            return [2 /*return*/, result.upsertedCount];
                                    }
                                });
                            }); },
                            removeById: function (bookmarkId) { return __awaiter(void 0, void 0, void 0, function () {
                                var deletedCount;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, mutations["delete"](bookmarkId)];
                                        case 1:
                                            deletedCount = _a.sent();
                                            emitEvent('BOOKMARK_REMOVE', { bookmarkId: bookmarkId });
                                            console.log('DELETE', deletedCount);
                                            return [2 /*return*/, deletedCount];
                                    }
                                });
                            }); },
                            create: function (doc, userId) { return __awaiter(void 0, void 0, void 0, function () {
                                var bookmarkId;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, mutations.create(doc, userId)];
                                        case 1:
                                            bookmarkId = _a.sent();
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
                            },
                            update: mutations.update,
                            "delete": mutations["delete"]
                        }];
            }
        });
    });
};
//# sourceMappingURL=configureBookmarksModule.js.map