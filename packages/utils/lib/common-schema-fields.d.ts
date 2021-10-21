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
    namespace createdBy {
        const type_2: StringConstructor;
        export { type_2 as type };
        const required_2: boolean;
        export { required_2 as required };
    }
    namespace updated {
        const type_3: DateConstructor;
        export { type_3 as type };
        const required_3: boolean;
        export { required_3 as required };
    }
    namespace updatedBy {
        const type_4: StringConstructor;
        export { type_4 as type };
        const required_4: boolean;
        export { required_4 as required };
    }
    namespace deleted {
        const type_5: DateConstructor;
        export { type_5 as type };
        const required_5: boolean;
        export { required_5 as required };
    }
    namespace deletedBy {
        const type_6: StringConstructor;
        export { type_6 as type };
        const required_6: boolean;
        export { required_6 as required };
    }
}
