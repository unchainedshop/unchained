import type { FastifyInstance } from 'fastify';
import { connectLocalFilesFastify } from '../files/local/handler-fastify.ts';

export default (fastify: FastifyInstance) => {
  connectLocalFilesFastify(fastify);
};
