import SimpleSchema from 'simpl-schema';
import { Collection, ModuleMutations, _ID } from 'unchained-core-types';
export declare const generateDbMutations: <T extends {
    _id?: _ID;
}>(collection: Collection<T>, schema: SimpleSchema) => ModuleMutations<T>;
