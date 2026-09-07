import { createLogger } from '@unchainedshop/logger';
import type { PluginHttpRequestContext } from '@unchainedshop/core';
import type { RolesInterface } from '@unchainedshop/roles';
import { Readable } from 'node:stream';

const logger = createLogger('unchained:bulk-import');

export async function bulkImportHandler(
  request: Request,
  context: PluginHttpRequestContext,
): Promise<Response> {
  try {
    const authentication = context as PluginHttpRequestContext & {
      roles?: RolesInterface;
      user?: any;
    };
    const hasPermission = await authentication.roles?.userHasPermission(
      authentication,
      'bulkImport',
      [],
    );
    if (!hasPermission) {
      return Response.json(
        { error: 'Permission denied', message: 'User does not have bulkImport permission' },
        { status: 403 },
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const input: any = {
      createShouldUpsertIfIDExists: url.searchParams.get('createShouldUpsertIfIDExists') === 'true',
      updateShouldUpsertIfIDNotExists:
        url.searchParams.get('updateShouldUpsertIfIDNotExists') === 'true',
      skipCacheInvalidation: url.searchParams.get('skipCacheInvalidation') === 'true',
      remoteAddress: context.remoteAddress,
    };

    const date = new Date().toISOString();

    if (!request.body) {
      return Response.json({ error: 'No request stream available' }, { status: 400 });
    }
    const stream = Readable.fromWeb(request.body as Parameters<typeof Readable.fromWeb>[0]);

    const file = await context.services.files.uploadFileFromStream({
      directoryName: 'bulk-import-streams',
      rawFile: Promise.resolve({
        filename: `${date}.json`,
        createReadStream: () => stream,
      }),
      chunkSizeBytes: 1024 * 1024 * 5, // 5MB chunks
      meta: {},
    });

    const validationStream = await context.services.files.createDownloadStream({
      fileId: file._id,
    });
    if (!validationStream) {
      throw new Error('Could not create download stream from uploaded file');
    }
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

    return Response.json(work, { status: 200 });
  } catch (e: any) {
    logger.error(e);
    return Response.json({ name: e.name, code: e.code, message: e.message }, { status: 503 });
  }
}
