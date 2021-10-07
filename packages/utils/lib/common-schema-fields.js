export var contextFields = {
    context: {
        type: Object,
        blackbox: true,
        required: false
    }
};
export var logFields = {
    log: Array,
    'log.$': {
        type: Object
    },
    'log.$.date': {
        type: Date
    },
    'log.$.status': {
        type: String
    },
    'log.$.info': {
        type: String
    }
};
export var timestampFields = {
    created: { type: Date, required: true },
    updated: { type: Date, required: false },
    deleted: { type: Date, required: false }
};
//# sourceMappingURL=common-schema-fields.js.map