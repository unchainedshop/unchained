import { express/*, uws*/ } from '@unchainedshop/api';

export * from './startPlatform.js';
export * from './context/index.js';

const connectPlatformToExpress4 = express.connect;
// const connectPlatformToUWS = uws.connect;

export { connectPlatformToExpress4 /*, connectPlatformToUWS */ };
