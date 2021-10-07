/// <reference types="node" />
export const asyncLocalStorage: AsyncLocalStorage<any>;
declare function _default(): any;
export default _default;
export function withContext(context: any): (middleware: any) => (req: any, res: any, ...rest: any[]) => void;
import { AsyncLocalStorage } from "async_hooks";
