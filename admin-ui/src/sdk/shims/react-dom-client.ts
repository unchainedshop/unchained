import { hostDep } from './host';

const ReactDOMClient = hostDep('react-dom/client');

export const createRoot = ReactDOMClient.createRoot;
export const hydrateRoot = ReactDOMClient.hydrateRoot;
