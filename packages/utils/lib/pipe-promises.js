export default (function (fns) { return function (initialValue) {
    return fns.reduce(function (sum, fn) { return Promise.resolve(sum).then(fn); }, initialValue);
}; });
//# sourceMappingURL=pipe-promises.js.map