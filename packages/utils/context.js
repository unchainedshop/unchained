import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage();

export default () => asyncLocalStorage.getStore();

export const withContext =
  (context) =>
  (middleware) =>
  (req, res, ...rest) => {
    asyncLocalStorage.run(context({ req, res }), () => {
      middleware(req, res, ...rest);
    });
  };
