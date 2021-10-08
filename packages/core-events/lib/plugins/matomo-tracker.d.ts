export declare type OrderOption = {
    ec_id?: string;
    _ects?: number;
    uid?: string;
    _id?: string;
    revenue?: number;
    ec_tx?: number;
    ec_dt?: number;
    ec_items?: string;
    idgoal?: number;
};
export interface MatomoOptions {
    transform: (eventName: string, orderOptions: OrderOption, context: any) => OrderOption;
}
declare const MatomoTracker: (siteId: number, siteUrl: string, subscribeTo: string, options?: MatomoOptions) => void;
export declare const initMatomo: (siteId: number, url: string, options?: MatomoOptions) => void;
export default MatomoTracker;
