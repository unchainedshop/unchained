import { Modules } from "unchained-core-types";
export declare type MigrateBookmarksService = (params: {
    fromUserId: string;
    toUserId: string;
    mergeBookmarks: () => void;
}, context: {
    modules: Modules;
}) => Promise<void>;
export declare const migrateBookmarksService: MigrateBookmarksService;
