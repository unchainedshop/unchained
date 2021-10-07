export namespace contextFields {
    namespace context {
        const type: ObjectConstructor;
        const blackbox: boolean;
        const required: boolean;
    }
}
export const logFields: {
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
export namespace timestampFields {
    namespace created {
        const type_1: DateConstructor;
        export { type_1 as type };
        const required_1: boolean;
        export { required_1 as required };
    }
    namespace updated {
        const type_2: DateConstructor;
        export { type_2 as type };
        const required_2: boolean;
        export { required_2 as required };
    }
    namespace deleted {
        const type_3: DateConstructor;
        export { type_3 as type };
        const required_3: boolean;
        export { required_3 as required };
    }
}
