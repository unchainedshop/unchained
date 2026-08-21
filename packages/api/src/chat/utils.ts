import type * as aiTypes from 'ai';
import type { ServerResponse } from 'node:http';
import { createLogger } from '@unchainedshop/logger';
import { isPeerNotInstalledError } from '../utils/optionalPeerError.ts';

const logger = createLogger('unchained:api:chat');

// Distinguishes a genuinely absent optional peer (expected, warn) from a package that is
// installed but failed to load (a real error that must not be reported as "not installed").
export const logOptionalPeerLoadError = (packageName: string, error: unknown) => {
  if (isPeerNotInstalledError(packageName, error)) {
    logger.warn(`optional peer npm package '${packageName}' not installed, chat will not work`);
  } else {
    logger.error(`failed to load '${packageName}'`, error);
  }
};

let NoSuchToolError: typeof aiTypes.NoSuchToolError;
let InvalidArgumentError: typeof aiTypes.InvalidArgumentError;

try {
  const aiTools = await import('ai');
  InvalidArgumentError = aiTools.InvalidArgumentError;
  NoSuchToolError = aiTools.NoSuchToolError;
} catch {
  // Reported by the chat handlers' own loaders; the errorHandler below guards for absence.
}

export type StreamTextParams = Parameters<typeof aiTypes.streamText>[0];

export type ChatConfiguration = Omit<StreamTextParams, 'messages'> & {
  unchainedMCPUrl?: string;
  imageGenerationTool?: { model: aiTypes.ImageModel; uploadUrl?: string };
};

export const errorHandler = (error: any): string => {
  if (NoSuchToolError?.isInstance(error)) return 'NoSuchToolError';
  if (InvalidArgumentError?.isInstance(error)) return 'InvalidToolArgumentsError';
  /* if (ToolExecutionError.isInstance(error)) return 'ToolExecutionError'; */
  if (error?.message?.toLowerCase()?.includes('forbidden')) return 'NetworkError';
  if (error?.message?.toLowerCase()?.includes('limit')) return 'LimitExceeded';
  return `Failed to stream response: ${error?.message || 'Unknown error'}`;
};

export const chatErrorStatus = (error: unknown): number =>
  (error as { statusCode?: number })?.statusCode === 503 ? 503 : 500;

// Owns the lifetime shared by a chat HTTP response, its model stream, and its MCP client.
// ServerResponse.close distinguishes an abandoned response via writableFinished, just like
// the MCP Node bridge. A configured caller signal participates in the same cancellation path.
export const createChatRequestLifecycle = (response: ServerResponse, configuredSignal?: AbortSignal) => {
  const disconnectController = new AbortController();
  const signal = configuredSignal
    ? AbortSignal.any([configuredSignal, disconnectController.signal])
    : disconnectController.signal;
  let clientClose: (() => Promise<void>) | undefined;
  let closing: Promise<void> | undefined;

  const detach = () => {
    response.off('close', abortOnDisconnect);
    signal.removeEventListener('abort', closeAfterAbort);
  };

  const close = async () => {
    detach();
    if (!clientClose) return;
    closing ??= clientClose();
    await closing;
  };

  const closeAfterAbort = () => {
    void close().catch((error) => logger.error('Failed to close MCP chat client', error));
  };

  const abortOnDisconnect = () => {
    if (!response.writableFinished && !disconnectController.signal.aborted) {
      disconnectController.abort(new Error('Chat HTTP client disconnected'));
    }
  };

  response.once('close', abortOnDisconnect);
  signal.addEventListener('abort', closeAfterAbort, { once: true });
  if (signal.aborted) queueMicrotask(closeAfterAbort);

  return {
    signal,
    setClientClose(closeClient: () => Promise<void>) {
      clientClose = closeClient;
      if (signal.aborted) closeAfterAbort();
    },
    close,
  };
};

export const categorizeTools = (toolName: string): string => {
  const name = toolName.toLowerCase();

  if (name.includes('product')) return 'Product Management';
  if (name.includes('order')) return 'Order Management';
  if (name.includes('customer') || name.includes('user')) return 'Customer Management';
  if (name.includes('shop') || name.includes('settings')) return 'Shop Configuration';
  if (name.includes('assortment')) return 'Assortments';
  if (name.includes('filter')) return 'Filters';
  if (name.includes('image') || name.includes('generate')) return 'Media & Content';

  return 'Other Tools';
};
