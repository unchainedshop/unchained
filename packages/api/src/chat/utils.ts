import type * as aiTypes from 'ai';

let NoSuchToolError: typeof aiTypes.NoSuchToolError;
let InvalidArgumentError: typeof aiTypes.InvalidArgumentError;

try {
  const aiTools = await import('ai');
  InvalidArgumentError = aiTools.InvalidArgumentError;
  NoSuchToolError = aiTools.NoSuchToolError;
} catch {
  // Already handled
}

export type StreamTextParams = Parameters<typeof aiTypes.streamText>[0];

export type ChatConfiguration = Omit<StreamTextParams, 'messages'> & {
  unchainedMCPUrl?: string;
  imageGenerationTool?: { model: aiTypes.ImageModel; uploadUrl?: string };
};

export const errorHandler = (error: any): string => {
  if (NoSuchToolError.isInstance(error)) return 'NoSuchToolError';
  if (InvalidArgumentError.isInstance(error)) return 'InvalidToolArgumentsError';
  /* if (ToolExecutionError.isInstance(error)) return 'ToolExecutionError'; */
  if (error?.message?.toLowerCase()?.includes('forbidden')) return 'NetworkError';
  if (error?.message?.toLowerCase()?.includes('limit')) return 'LimitExceeded';
  return `Failed to stream response: ${error?.message || 'Unknown error'}`;
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
