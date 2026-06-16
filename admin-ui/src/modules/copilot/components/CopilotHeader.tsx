import React, { useState } from 'react';
import { TrashIcon, ServerIcon } from '@heroicons/react/24/outline';
import { useChatContext } from '..';
import { useIntl } from 'react-intl';
import MCPServersPanel from './MCPServersPanel';

const CopilotHeader: React.FC = () => {
  const { formatMessage } = useIntl();
  const {
    messages,
    clearHistory,
    mcpServers,
    addMCPServer,
    removeMCPServer,
    toggleMCPServer,
  } = useChatContext();
  const [showMCPPanel, setShowMCPPanel] = useState(false);

  const enabledCount = mcpServers.filter((s) => s.enabled).length;

  return (
    <>
      <header className="p-4 mt-1 flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="text-xl font-semibold text-text-primary">
          Unchained
          <span className="font-light ml-1">
            Copilot<span className="text-xs ml-1"> 1.0</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMCPPanel(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-slate-900 hover:bg-white dark:hover:text-slate-200 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 rounded-md dark:hover:bg-slate-700 transition-colors"
          >
            <ServerIcon className="h-4 w-4" />
            {formatMessage({
              id: 'mcp_servers',
              defaultMessage: 'MCP Servers',
            })}
            {enabledCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full">
                {enabledCount}
              </span>
            )}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-slate-900 hover:bg-white dark:hover:text-slate-200 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 rounded-md dark:hover:bg-slate-700 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              {formatMessage({
                id: 'clear_history',
                defaultMessage: 'Clear History',
              })}
            </button>
          )}
        </div>
      </header>
      {showMCPPanel && (
        <MCPServersPanel
          servers={mcpServers}
          onAdd={addMCPServer}
          onRemove={removeMCPServer}
          onToggle={toggleMCPServer}
          onClose={() => setShowMCPPanel(false)}
        />
      )}
    </>
  );
};

export default CopilotHeader;
