import SimpleSchema from 'simpl-schema';
import { Collection, ModuleMutations } from 'unchained-core-types';
export declare const generateDbMutations: <T extends {}>(collection: Collection<T>, schema: SimpleSchema) => ModuleMutations<T>;
