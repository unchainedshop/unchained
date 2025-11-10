import { FastifyInstance } from 'fastify';
import handler from '../files/gridfs/handler-fastify.js';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs' } = process.env;

export default (fastify: FastifyInstance) => {
  fastify.register((s, opts, registered) => {
    // Disable JSON parsing!
    s.removeAllContentTypeParsers();
    s.addContentTypeParser('*', function (req, payload, done) {
      done(null);
    });
    s.route({
      url: GRIDFS_PUT_SERVER_PATH + '/:directoryName/:fileName',
      method: ['GET', 'PUT', 'OPTIONS'],
      handler,
    });
    registered();
  });
};
