import { ObjectId } from 'unchained-core-types';
export var generateDbFilterById = function (id) {
    var _id = typeof id === 'string' && id.length === 12 || id.length === 24
        ? new ObjectId(id)
        : id;
    return { _id: _id };
};
//# sourceMappingURL=generate-db-filter-by-id.js.map