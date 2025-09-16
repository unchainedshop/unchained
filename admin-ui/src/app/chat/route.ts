import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  experimental_createMCPClient as createMCPClient,
  MCPTransport,
  convertToModelMessages,
  streamText,
  ToolSet,
  stepCountIs,
} from 'ai';
import generateImageHandler from '../../../static-servers/generateImageHandler';
import { defaultSystemPrompt, errorHandler } from '../../../static-servers';
import { chatModel, imageModel } from './local-provider';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const unchainedMCPUrl = process.env.MCP_API_URL || 'http://localhost:4010/mcp';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const httpTransport = new StreamableHTTPClientTransport(
    new URL(unchainedMCPUrl),
    {
      requestInit: {
        headers: {
          Cookie: req.headers.get('cookie') || '',
        },
      },
    },
  );
  const client = await createMCPClient({
    transport: httpTransport as MCPTransport,
  });
  const defaultUnchainedTools = await client.tools();
  console.log('Available tools:', defaultUnchainedTools);
  const tools: ToolSet = defaultUnchainedTools;
  if (process.env.NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL && imageModel) {
    tools.generateImage = generateImageHandler(req)({
      model: imageModel,
      uploadUrl: process.env.NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL,
    }) as any;
  }

  const result = streamText({
    system: defaultSystemPrompt,
    model: chatModel,
    messages: convertToModelMessages(messages, {
      tools,
      ignoreIncompleteToolCalls: true,
    }),
    stopWhen: stepCountIs(10),
    tools,
    onError: async (e) => {
      console.error(e);
    },
    onFinish: async () => {
      await client?.close();
    },
  });

  return result.toUIMessageStreamResponse({
    onError: errorHandler,
  });
}
