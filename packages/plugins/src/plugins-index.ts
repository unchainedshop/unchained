import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:plugins');

export const defaultModules = new Proxy(
  {},
  {
    ownKeys: () => {
      logger.error(`defaultModules has been moved, load all the plugins via the all preset:
  * @unchainedshop/plugins/presets/all.js`);
      return [];
    },
  },
);

export const connectDefaultPluginsToExpress4 = (...args: any[]) => { // eslint-disable-line
  logger.error(`connectDefaultPluginsToExpress4 has been moved, to load all plugin handlers use direct imports based on the environment you use:
  * @unchainedshop/plugins/presets/all-express.js
  * @unchainedshop/plugins/presets/all-fastify.js
  `);
};
