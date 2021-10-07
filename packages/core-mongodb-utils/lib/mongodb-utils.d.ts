export { AddressSchema } from './schemas/AddressSchema';
export { ContactSchema } from './schemas/ContactSchema';
export declare const SchemaFields: {
    contextFields: {
        context: {
            type: ObjectConstructor;
            blackbox: boolean;
            required: boolean;
        };
    };
    logFields: {
        log: ArrayConstructor;
        'log.$': {
            type: ObjectConstructor;
        };
        'log.$.date': {
            type: DateConstructor;
        };
        'log.$.status': {
            type: StringConstructor;
        };
        'log.$.info': {
            type: StringConstructor;
        };
    };
    timestampFields: {
        created: {
            type: DateConstructor;
            required: boolean;
        };
        updated: {
            type: DateConstructor;
            required: boolean;
        };
        deleted: {
            type: DateConstructor;
            required: boolean;
        };
    };
};
