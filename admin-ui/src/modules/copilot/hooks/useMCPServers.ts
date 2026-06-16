import { useCallback } from 'react';
import useLocalStorage from '../../common/hooks/useLocalStorage';

export interface MCPServerEntry {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface MCPServerPayload {
  url: string;
  name?: string;
  headers?: Record<string, string>;
}

export const useMCPServers = () => {
  const [servers, setServers] = useLocalStorage(
    'copilot-mcp-servers',
    [] as MCPServerEntry[],
  );

  const addServer = useCallback(
    (entry: Omit<MCPServerEntry, 'id' | 'enabled'>) => {
      const newEntry: MCPServerEntry = {
        ...entry,
        id: crypto.randomUUID(),
        enabled: true,
      };
      setServers((prev: MCPServerEntry[]) => [...prev, newEntry]);
      return newEntry;
    },
    [setServers],
  );

  const removeServer = useCallback(
    (id: string) => {
      setServers((prev: MCPServerEntry[]) =>
        prev.filter((s: MCPServerEntry) => s.id !== id),
      );
    },
    [setServers],
  );

  const toggleServer = useCallback(
    (id: string) => {
      setServers((prev: MCPServerEntry[]) =>
        prev.map((s: MCPServerEntry) =>
          s.id === id ? { ...s, enabled: !s.enabled } : s,
        ),
      );
    },
    [setServers],
  );

  const enabledServers = (servers as MCPServerEntry[]).filter(
    (s: MCPServerEntry) => s.enabled,
  );

  const mcpServersPayload: MCPServerPayload[] = enabledServers.map((s) => ({
    url: s.url,
    name: s.name,
  }));

  return {
    servers: servers as MCPServerEntry[],
    enabledServers,
    mcpServersPayload,
    addServer,
    removeServer,
    toggleServer,
  };
};
