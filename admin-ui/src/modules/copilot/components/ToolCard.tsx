import React from 'react';
import { Tool } from '../hooks/useAvailableTools';
import {
  CubeIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  Cog8ToothIcon,
  FunnelIcon,
  PhotoIcon,
  SparklesIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import useToolTextNormalizer from '../hooks/useToolTextNormalizer';

interface ToolCardProps {
  tool: Tool;
}

const categoryIcons: Record<string, React.ElementType> = {
  'Product Management': CubeIcon,
  'Order Management': ShoppingCartIcon,
  'Customer Management': UserGroupIcon,
  'Shop Configuration': Cog8ToothIcon,
  Filters: FunnelIcon,
  Assortments: RectangleStackIcon,
  'Media & Content': PhotoIcon,
  'Other Tools': SparklesIcon,
};

const categoryColors: Record<string, string> = {
  'Product Management':
    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  'Order Management':
    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  'Customer Management':
    'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  'Shop Configuration':
    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  Filters: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
  Assortments:
    'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
  'Media & Content':
    'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
  'Other Tools':
    'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300',
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const { normalizeToolName, getToolDescription } = useToolTextNormalizer();
  const Icon = categoryIcons[tool.category] || SparklesIcon;
  const colorClass =
    categoryColors[tool.category] || categoryColors['Other Tools'];

  return (
    <div className="group relative p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {normalizeToolName(tool.name)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {tool.description}
          </p>
          <div className="mt-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
              {getToolDescription(tool.name)}
            </p>
          </div>
        </div>
      </div>

      {tool.description.length > 60 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-900 dark:bg-slate-950 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {tool.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950"></div>
        </div>
      )}
    </div>
  );
};

export default ToolCard;
