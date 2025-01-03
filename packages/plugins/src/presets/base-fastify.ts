import { FastifyInstance } from 'fastify';
import handler from '../files/gridfs/handler-fastify.js';

const { GRIDFS_PUT_SERVER_PATH = '/gridfs/:directoryName/:fileName' } = process.env;

export default (fastify: FastifyInstance) => {
  fastify.addContentTypeParser('*', function (req, payload, done) {
    done(null);
  });
  fastify.route({
    url: GRIDFS_PUT_SERVER_PATH,
    method: ['GET', 'PUT', 'OPTIONS'],
    handler,
  });
};
