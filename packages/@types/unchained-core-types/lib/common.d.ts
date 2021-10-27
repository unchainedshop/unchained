import { Db, UpdateFilter, ObjectId } from "mongodb";
export declare type _ID = string | ObjectId;
export declare type TimestampFields = {
    created?: Date;
    createdBy?: string;
    updated?: Date;
    updatedBy?: string;
    deleted?: Date;
    deletedBy?: string;
};
export declare type Query = {
    [x: string]: any;
};
export interface ModuleInput {
    db: Db;
}
export interface ModuleMutations<T extends {}> {
    create: (doc: T, userId?: string) => Promise<string>;
    update: (_id: string, doc: UpdateFilter<T>, userId?: string) => Promise<void>;
    delete: (_id: string) => Promise<number>;
}
