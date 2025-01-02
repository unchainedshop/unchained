import { gridfsHandler } from '../files/gridfs/gridfs-webhook-express.js';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs' } = process.env;

export default (app) => {
  app.use(GRIDFS_PUT_SERVER_PATH, gridfsHandler);
};
