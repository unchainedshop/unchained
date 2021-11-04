import SimpleSchema from 'simpl-schema';
import { Collection } from 'unchained-core-types';
export declare const generateDbMutations: <T extends {
    _id?: any;
}>(collection: Collection<T>, schema: SimpleSchema) => any;
