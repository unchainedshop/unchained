import { hostDep } from './host';

const NextHead = hostDep('next/head');

export default NextHead.default ?? NextHead;
