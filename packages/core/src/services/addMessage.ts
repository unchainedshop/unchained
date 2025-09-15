import { Work } from '@unchainedshop/core-worker';
import { MessagingDirector } from '../core-index.js';
import { Modules } from '../modules.js';

export async function addMessageService<T = Record<string, any>>(
  this: Modules,
  template: string,
  input: T,
): Promise<Work | null> {
  const templateResolver = MessagingDirector.getTemplate(template); // Validate template exists
  if (!templateResolver) return null;
  return this.worker.addWork({
    type: 'MESSAGE',
    input: {
      template,
      ...input,
    },
    retries: 0,
  });
}
