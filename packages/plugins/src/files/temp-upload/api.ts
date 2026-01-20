import { createLogger } from '@unchainedshop/logger';
import { type UnchainedCore, getFileAdapter } from '@unchainedshop/core';
import { Roles } from '@unchainedshop/roles';

const logger = createLogger('unchained:temp-upload');

export async function tempUploadHandler(
  request: Request,
  context: UnchainedCore & {
    params: Record<string, string>;
    userId?: string;
    user?: any;
  },
): Promise<Response> {
  try {
    // ACL check - cast context for Roles compatibility
    const hasPermission = await Roles.userHasPermission(
      context as { userId?: string; user?: any },
      'uploadTempFile',
      [],
    );
    if (!hasPermission) {
      return Response.json(
        { error: 'Permission denied', message: 'User does not have uploadTempFile permission' },
        { status: 403 },
      );
    }

    // Parse multipart form data using WHATWG FormData API
    const formData = await request.formData();

    // Try to get file from 'file' field first, then fallback to first file in form
    let file: File | null = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      for (const [, value] of formData.entries()) {
        if (value instanceof File) {
          file = value;
          break;
        }
      }
    }

    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to buffer for uploadFileFromStream
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadedFile = await context.services.files.uploadFileFromStream({
      directoryName: 'temp-uploads',
      rawFile: {
        filename: file.name,
        buffer,
        mimetype: file.type,
      },
      meta: { encoding: 'binary' },
    });

    // Set expiration to 24 hours
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await context.modules.files.update(uploadedFile._id, {
      expires,
    });

    const fileUploadAdapter = getFileAdapter();
    const rawUrl = await fileUploadAdapter.createDownloadURL(uploadedFile);
    if (!rawUrl) throw new Error('Could not create download URL for file');
    const url = context.modules.files.normalizeUrl(rawUrl, {});

    return Response.json(
      { fileId: uploadedFile._id, url, expires: expires.toISOString() },
      { status: 200 },
    );
  } catch (e: any) {
    logger.error(e);
    return Response.json({ name: e.name, code: e.code, message: e.message }, { status: 503 });
  }
}
