import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  experimental_createMCPClient as createMCPClient,
  MCPTransport,
  ToolSet,
} from 'ai';
import normalizeToolsIndex from '../../../../static-servers/normalizeToolsIndex';
import { generateImageHandler } from '../../../../static-servers';
import { imageModel } from '../local-provider';

export const dynamic = 'force-static';

const unchainedMCPUrl = process.env.MCP_API_URL || 'http://localhost:4010/mcp';

export async function GET(req: Request) {
  try {
    // Fetch fresh tools from MCP
    const client = await createMCPClient({
      transport: new StreamableHTTPClientTransport(new URL(unchainedMCPUrl), {
        requestInit: {
          headers: {
            Cookie: req.headers.get('cookie') || '',
          },
        },
      }) as MCPTransport,
    });

    const defaultUnchainedTools = await client.tools();
    const tools: ToolSet = defaultUnchainedTools;
    if (process.env.NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL && imageModel) {
      tools.generateImage = generateImageHandler(req)({
        model: imageModel,
        uploadUrl: process.env.NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL,
      }) as any;
    }

    // Update cache
    await client.close();

    return Response.json({
      tools: normalizeToolsIndex(tools),
      cached: false,
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to fetch tools',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
