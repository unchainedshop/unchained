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
    createdBy: { type: String, required: false },
    updated: { type: Date, required: false },
    updatedBy: { type: String, required: false },
    deleted: { type: Date, required: false },
    deletedBy: { type: String, required: false }
};
//# sourceMappingURL=common-schema-fields.js.map