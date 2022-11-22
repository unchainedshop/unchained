import { express } from '@unchainedshop/api';

export * from './startPlatform';
export * from './context';

const connectPlatformToExpress4 = express.connect;

export { connectPlatformToExpress4 };
