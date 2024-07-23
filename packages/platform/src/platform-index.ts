import { express } from '@unchainedshop/api';

export * from './startPlatform.js';
export * from './context/index.js';

const connectPlatformToExpress4 = express.connect;

export { connectPlatformToExpress4 };
