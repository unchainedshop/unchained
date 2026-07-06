import { hostDep } from './host';

const runtime = hostDep('react/jsx-runtime');

export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
export const Fragment = runtime.Fragment;
