import { hostDep } from './host';

const NextImage = hostDep('next/image');

export default NextImage.default ?? NextImage;
