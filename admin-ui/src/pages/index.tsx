import React from 'react';
import ShopSetupChecklist from '../modules/copilot/components/ShopSetupChecklist';
import { WorkQueueWarningBanner } from '../modules/work/components/WorkQueueWarningBanner';
import SystemInfoPanel from '../modules/common/components/SystemInfoPanel';
import DashboardShortcutCard from '../modules/common/components/DashboardShortcutCard';
import useShopConfiguration from '../modules/common/hooks/useShopConfiguration';
import DashboardMetrics from '../modules/common/components/DashboardMetrics';
import AnalyticsDashboard from '../modules/common/components/AnalyticsDashboard';
import { default as packageJson } from '../../package.json' with { type: 'json' };

const HomePage = () => {
  const { configuration } = useShopConfiguration();
  const { isFullyConfigured } = configuration;

  return (
    <div>
      <WorkQueueWarningBanner />
      <div className="mt-5">
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Unchained
          <span className="font-light ml-1">
            AdminUI<span className="text-xs ml-1"> {packageJson.version}</span>
          </span>
        </div>
      </div>
      <div className="mx-auto py-6">
        <ShopSetupChecklist className="mb-8" />
        {isFullyConfigured && <DashboardMetrics />}
        <AnalyticsDashboard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isFullyConfigured && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <DashboardShortcutCard />
            </div>
          )}
          <SystemInfoPanel />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
