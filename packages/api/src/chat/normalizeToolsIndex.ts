import { categorizeTools } from './utils.ts';

export default function normalizeToolsIndex(mcpTools: any) {
  const tools = Object.entries(mcpTools).map(([name, tool]: any) => ({
    name,
    description: tool.description || '',
    parameters: tool.parameters || {},
    category: categorizeTools(name),
  }));
  return tools;
}
