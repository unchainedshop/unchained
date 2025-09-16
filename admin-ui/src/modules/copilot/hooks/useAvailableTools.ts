import { useState, useEffect, useCallback, useMemo } from 'react';
import { ToolName } from './useToolTextNormalizer';
import { useIntl } from 'react-intl';

export interface Tool {
  name: ToolName;
  description: string;
  category: string;
}

export interface ToolsResponse {
  tools: Tool[];
  cached: boolean;
  timestamp: number;
  error?: string;
}

interface UseAvailableToolsReturn {
  tools: Tool[];
  groupedTools: Record<string, Tool[]>;
  loading: boolean;
  error: string | null;
}

export const useAvailableTools = (): UseAvailableToolsReturn => {
  const { formatMessage } = useIntl();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = process.env.NEXT_PUBLIC_CHAT_URL
      ? `${process.env.NEXT_PUBLIC_CHAT_URL}/tools`
      : '/chat/tools';

    try {
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.statusText}`);
      }

      const data: ToolsResponse = await response.json();

      if (data.error && !data.tools?.length) {
        throw new Error(data.error);
      }

      setTools(data.tools || []);
    } catch (err) {
      const message =
        process.env.NODE_ENV === 'development'
          ? null
          : formatMessage({
              id: 'tool_fetch_failed_error',
              defaultMessage: 'Failed to fetch available tools',
            });

      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Chat tools endpoint not available, using default tools. This is expected if the backend chat service is not running.',
          err,
        );
      } else {
        console.error('Error fetching tools:', err);
      }

      setError(message);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [formatMessage]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const groupedTools = useMemo(() => {
    return tools.reduce<Record<string, Tool[]>>(
      (acc, tool) => {
        (acc[tool.category] ||= []).push(tool);
        return acc;
      },
      {} as Record<string, Tool[]>,
    );
  }, [tools]);
  return { tools, groupedTools, loading, error };
};
