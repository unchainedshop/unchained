import { createLogger } from '@unchainedshop/logger';
import { checkAction } from '../acl.js';
import { actions } from '../roles/index.js';
import { Context } from '../context.js';
import { validateBulkImportStream, ValidationError } from '../bulk-import/streamValidator.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';
import { Readable } from 'stream';

const logger = createLogger('unchained:bulk-import');

const bulkImportHandlerWithValidation: RouteHandlerMethod = async (
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

    // Collect the entire stream to validate it
    const chunks: Buffer[] = [];
    let totalSize = 0;

    for await (const chunk of req.raw) {
      chunks.push(chunk);
      totalSize += chunk.length;
      
      // Prevent extremely large payloads (configurable limit)
      const maxSize = 100 * 1024 * 1024; // 100MB default limit
      if (totalSize > maxSize) {
        logger.error(`Payload too large: ${totalSize} bytes exceeds ${maxSize} bytes`);
        res.status(413);
        return res.send(JSON.stringify({ 
          name: 'PayloadTooLarge', 
          code: 'PAYLOAD_TOO_LARGE',
          message: `Payload size ${totalSize} bytes exceeds maximum allowed size of ${maxSize} bytes` 
        }));
      }
    }

    const fullPayload = Buffer.concat(chunks);
    
    // Parse JSON to check basic structure before streaming validation
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(fullPayload.toString());
    } catch (parseError) {
      logger.error('Invalid JSON payload:', parseError.message);
      res.status(400);
      return res.send(JSON.stringify({ 
        name: 'InvalidJSON', 
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON' 
      }));
    }

    // Stream validation
    logger.debug('Starting stream validation for bulk import');
    const readableStream = Readable.from([fullPayload]);
    
    try {
      const validationResult = await validateBulkImportStream(readableStream);
      
      if (!validationResult.isValid) {
        logger.error(`Schema validation failed: ${validationResult.errors.length} errors found`);
        
        // Return detailed validation errors
        const errorResponse = {
          name: 'ValidationError',
          code: 'SCHEMA_VALIDATION_FAILED', 
          message: `Schema validation failed with ${validationResult.errors.length} error(s)`,
          details: {
            eventsProcessed: validationResult.eventsProcessed,
            errors: validationResult.errors.map((error: ValidationError) => ({
              path: error.path.join('.'),
              message: error.message,
              code: error.code,
              eventIndex: error.eventIndex,
            })),
          },
        };
        
        res.status(400);
        return res.send(JSON.stringify(errorResponse));
      }
      
      logger.debug(`Schema validation passed for ${validationResult.eventsProcessed} events`);
    } catch (validationError) {
      logger.error('Validation process failed:', validationError.message);
      res.status(500);
      return res.send(JSON.stringify({ 
        name: 'ValidationProcessError', 
        code: 'VALIDATION_PROCESS_FAILED',
        message: 'Schema validation process failed: ' + validationError.message 
      }));
    }

    // If validation passes, proceed with file upload and work queue
    const date = new Date().toISOString();

    const file = await context.services.files.uploadFileFromStream({
      directoryName: 'bulk-import-streams',
      rawFile: Promise.resolve({ 
        filename: `${date}.json`, 
        createReadStream: () => Readable.from([fullPayload])
      }),
      meta: {
        validated: true,
        eventsCount: parsedPayload.events?.length || 0,
        validatedAt: date,
      },
    });

    input.payloadId = file._id;
    input.payloadSize = file.size;

    const purgedInput = Object.fromEntries(Object.entries(input).filter(([, value]) => Boolean(value)));

    const work = await context.modules.worker.addWork({
      type: 'BULK_IMPORT',
      input: purgedInput,
      retries: 0,
      priority: 10,
    });

    logger.info(`Bulk import work queued with ID: ${work._id}`);
    
    const body = JSON.stringify(work);
    res.status(200);
    res.header('Content-Length', Buffer.byteLength(body));
    res.header('Content-Type', 'application/json');
    return res.send(body);
  } catch (e) {
    logger.error('Bulk import handler error:', e.message);
    res.status(503);
    return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
  }
};

export default bulkImportHandlerWithValidation;