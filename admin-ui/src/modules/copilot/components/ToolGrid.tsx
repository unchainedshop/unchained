import React, { useState } from 'react';
import { Tool } from '../hooks/useAvailableTools';
import ToolCard from './ToolCard';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface ToolGridProps {
  groupedTools: Record<string, Tool[]>;
  loading: boolean;
  error: string | null;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  groupedTools,
  loading,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // Filter tools based on search term and category
  const filterTools = (tools: Tool[]): Tool[] => {
    return tools.filter((tool) => {
      if (searchTerm === '') return true;

      const searchLower = searchTerm.toLowerCase();
      const toolName = tool.name.toLowerCase();
      const toolDescription = tool.description.toLowerCase();

      // Check for matches in name and description
      const nameMatch = toolName.includes(searchLower);
      const descriptionMatch = toolDescription.includes(searchLower);

      // Also check for word-based matches (e.g., "create product" matches "create_product")
      const nameWords = toolName.replace(/_/g, ' ');
      const wordMatch = nameWords.includes(searchLower);

      return nameMatch || descriptionMatch || wordMatch;
    });
  };

  // Get filtered grouped tools
  const getFilteredGroups = (): Record<string, Tool[]> => {
    const filtered: Record<string, Tool[]> = {};
    Object.entries(groupedTools).forEach(([category, tools]) => {
      const filteredTools = filterTools(tools);
      if (filteredTools.length > 0) {
        filtered[category] = filteredTools;
      }
    });
    return filtered;
  };

  const filteredGroups = getFilteredGroups();
  const totalTools = Object.values(groupedTools).flat().length;
  const categories = Object.keys(groupedTools);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (loading) {
    return <ToolGridSkeleton />;
  }

  if (error && totalTools === 0) {
    return <ToolGridError error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with search and stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {totalTools} tools available
            </span>
          </div>

          {/* Search input */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-border-subtle rounded-lg bg-surface text-text-primary placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>
        </div>
      </div>

      {/* Tool categories */}
      <div className="space-y-6">
        {Object.entries(filteredGroups).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted">
              No tools found matching &quot;{searchTerm}&quot;
            </p>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([category, tools]) => {
            // Auto-expand categories when searching and results are found
            const isExpanded =
              expandedCategories[category] ||
              (searchTerm !== '' && tools.length > 0);

            return (
              <div
                key={category}
                className="border border-border-subtle rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 bg-surface/50 hover:bg-surface-raised transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-secondary">
                        {category}
                      </h3>
                      <span className="text-xs text-text-muted bg-surface-raised px-2 py-1 rounded-full">
                        {tools.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-surface">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tools.map((tool) => (
                        <ToolCard key={tool.name} tool={tool} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Loading skeleton
const ToolGridSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-10 bg-surface-raised rounded-lg w-48 mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6">
            <div className="h-5 bg-surface-raised rounded w-32 mb-3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="p-4 bg-surface-raised rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-surface-raised rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-surface-raised rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-surface-raised rounded w-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Error state
const ToolGridError: React.FC<{ error: string }> = ({ error }) => {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full mb-4">
        <svg
          className="w-8 h-8 text-danger"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        Unable to load tools
      </h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto">{error}</p>
      <p className="text-xs text-text-muted mt-4">
        Using default tool set. Full capabilities will be available when
        connected to the backend.
      </p>
    </div>
  );
};

export default ToolGrid;
