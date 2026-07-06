import { hostDep } from './host';

const ReactDOM = hostDep('react-dom');

export default ReactDOM.default ?? ReactDOM;

export const createPortal = ReactDOM.createPortal;
export const flushSync = ReactDOM.flushSync;
export const preconnect = ReactDOM.preconnect;
export const prefetchDNS = ReactDOM.prefetchDNS;
export const preinit = ReactDOM.preinit;
export const preload = ReactDOM.preload;
export const version = ReactDOM.version;
