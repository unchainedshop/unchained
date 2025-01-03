import handler from '../files/gridfs/handler-express.js';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs' } = process.env;

export default (app) => {
  app.use(GRIDFS_PUT_SERVER_PATH, handler);
};
