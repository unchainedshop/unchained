export function flattenSelector(selector) {
    // If selector uses $and format, convert to plain object selector
    if (Array.isArray(selector.$and)) {
        selector.$and.forEach(function (sel) {
            Object.assign(selector, flattenSelector(sel));
        });
        delete selector.$and;
    }
    var obj = {};
    Object.entries(selector).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        // Ignoring logical selectors (https://docs.mongodb.com/manual/reference/operator/query/#logical)
        if (!key.startsWith('$')) {
            if (typeof value === 'object' && value !== null) {
                if (value.$eq !== undefined) {
                    obj[key] = value.$eq;
                }
                else if (Array.isArray(value.$in) && value.$in.length === 1) {
                    obj[key] = value.$in[0];
                }
                else if (Object.keys(value).every(function (v) { return !(typeof v === 'string' && v.startsWith('$')); })) {
                    obj[key] = value;
                }
            }
            else {
                obj[key] = value;
            }
        }
    });
    return obj;
}
//# sourceMappingURL=flattenSelector.js.map