import { hostDep } from './host';

const NextLink = hostDep('next/link');

export default NextLink.default ?? NextLink;
