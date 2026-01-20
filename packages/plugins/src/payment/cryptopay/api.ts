import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import handleWebhook from './handle-webhook.ts';

const logger = createLogger('unchained:cryptopay');

export async function cryptopayWebhookHandler(
  request: Request,
  context: UnchainedCore,
): Promise<Response> {
  try {
    // Parse JSON body
    const body = await request.json();

    await handleWebhook(body, context as any);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error('Cryptopay webhook error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
