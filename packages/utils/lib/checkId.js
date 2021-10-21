export var checkId = function (value, error) {
    if (typeof value !== 'string') {
        throw error || { message: 'Invalid id' };
    }
};
//# sourceMappingURL=checkId.js.map