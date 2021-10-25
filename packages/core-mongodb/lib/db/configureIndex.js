export var configureIndex = function (db) {
    db.Collection.prototype.createIndex = function createIndex(name, keyPath, options) {
        var self = this;
        self.rawCollection().createIndex(name, keyPath, options);
    };
};
//# sourceMappingURL=configureIndex.js.map