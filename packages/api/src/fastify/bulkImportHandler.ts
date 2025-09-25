import { createLogger } from '@unchainedshop/logger';
import { checkAction } from '../acl.js';
import { actions } from '../roles/index.js';
import { Context } from '../context.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:bulk-import');

const bulkImportHandler: RouteHandlerMethod = async (
  req: FastifyRequest & { unchainedContext: Context },
  res,
) => {
  try {
    const context = req.unchainedContext;
    const query = req.query as any;

    await checkAction(context, (actions as any).bulkImport);

    const input: any = {
      createShouldUpsertIfIDExists: !!query?.createShouldUpsertIfIDExists,
      updateShouldUpsertIfIDNotExists: !!query?.updateShouldUpsertIfIDNotExists,
      skipCacheInvalidation: !!query?.skipCacheInvalidation,
      remoteAddress: context.remoteAddress,
    };

    const date = new Date().toISOString();

    const file = await context.services.files.uploadFileFromStream({
      directoryName: 'bulk-import-streams',
      rawFile: Promise.resolve({ filename: `${date}.json`, createReadStream: () => req.raw }),
      meta: {},
      chunkSizeBytes: 1024 * 1024 * 5, // 5MB chunks
    });

    const validationStream = await context.services.files.createDownloadStream({ fileId: file._id });
    await context.bulkImporter.validateEventStream(validationStream);

    input.payloadId = file._id;
    input.payloadSize = file.size;

    const purgedInput = Object.fromEntries(Object.entries(input).filter(([, value]) => Boolean(value)));

    const work = await context.modules.worker.addWork({
      type: 'BULK_IMPORT',
      input: purgedInput,
      retries: 0,
      priority: 10,
    });

    res.status(200);
    return res.send(work);
  } catch (e) {
    logger.error(e);
    res.status(503);
    return res.send({ name: e.name, code: e.code, message: e.message });
  }
};

export default bulkImportHandler;
