import { type IPlugin } from '@unchainedshop/core';
import { Post } from './adapter.ts';

// Plugin definition
export const PostPlugin: IPlugin = {
  key: 'shop.unchained.post',
  label: 'Post Delivery Plugin',
  version: '1.0.0',

  adapters: [Post],
};

export default PostPlugin;

// Re-export adapter for direct use
export { Post } from './adapter.ts';
