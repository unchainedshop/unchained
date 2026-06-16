import React, { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import type { MCPServerEntry } from '../hooks/useMCPServers';

interface MCPServersPanelProps {
  servers: MCPServerEntry[];
  onAdd: (entry: Omit<MCPServerEntry, 'id' | 'enabled'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onClose: () => void;
}

const MCPServersPanel: React.FC<MCPServersPanelProps> = ({
  servers,
  onAdd,
  onRemove,
  onToggle,
  onClose,
}) => {
  const { formatMessage } = useIntl();
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    onAdd({ name: newName.trim(), url: newUrl.trim() });
    setNewName('');
    setNewUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-text-primary">
            {formatMessage({
              id: 'mcp_servers',
              defaultMessage: 'MCP Servers',
            })}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-text-muted">
            {formatMessage({
              id: 'mcp_servers_description',
              defaultMessage:
                'Add additional MCP servers to extend Copilot with external tools. The built-in Unchained server is always connected.',
            })}
          </p>

          {servers.length > 0 && (
            <div className="space-y-2">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center gap-3 p-3 bg-surface-raised border border-border-subtle rounded-lg"
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      onChange={() => onToggle(server.id)}
                      className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                    />
                  </label>
                  <ServerIcon className="h-4 w-4 text-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {server.name}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {server.url}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(server.id)}
                    className="p-1 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={formatMessage({
                  id: 'server_name',
                  defaultMessage: 'Server name',
                })}
                className="flex-1 px-3 py-2 text-sm bg-surface-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/mcp"
                className="flex-1 px-3 py-2 text-sm bg-surface-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={!newName.trim() || !newUrl.trim()}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                {formatMessage({ id: 'add', defaultMessage: 'Add' })}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MCPServersPanel;
