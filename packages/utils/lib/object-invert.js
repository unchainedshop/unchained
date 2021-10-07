var invertMapObject = function (theMapObject) {
    return Object.keys(theMapObject).reduce(function (invertedObj, key) {
        var newObj = invertedObj;
        newObj[theMapObject[key]] = key;
        return newObj;
    }, {});
};
export default invertMapObject;
//# sourceMappingURL=object-invert.js.map