import { createLocalFilesMiddleware } from '../files/local/handler-express.ts';

const { LOCAL_FILES_PUT_SERVER_PATH = '/files' } = process.env;

export default (app) => {
  app.use(LOCAL_FILES_PUT_SERVER_PATH, createLocalFilesMiddleware());
};
