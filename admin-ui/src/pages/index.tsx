import React from 'react';
import ShopSetupChecklist from '../modules/copilot/components/ShopSetupChecklist';
import { WorkQueueWarningBanner } from '../modules/work/components/WorkQueueWarningBanner';
import SystemInfoPanel from '../modules/common/components/SystemInfoPanel';
import DashboardShortcutCard from '../modules/common/components/DashboardShortcutCard';
import useShopConfiguration from '../modules/common/hooks/useShopConfiguration';
import DashboardMetrics from '../modules/common/components/DashboardMetrics';
import AnalyticsDashboard from '../modules/common/components/AnalyticsDashboard';
import { default as packageJson } from '../../package.json' with { type: 'json' };
import PluginSlot from '../modules/plugins/PluginSlot';

const HomePage = () => {
  const { configuration } = useShopConfiguration();
  const { isFullyConfigured } = configuration;

  return (
    <div>
      <WorkQueueWarningBanner />
      <div className="mt-5">
        <div className="text-xl font-semibold text-text-primary">
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
            <div className="bg-surface rounded-lg border border-border-subtle p-6">
              <DashboardShortcutCard />
            </div>
          )}
          <SystemInfoPanel />
        </div>
        <PluginSlot slot="dashboard:widgets">
          {(Component, config) => (
            <div
              className={`mt-6 ${
                config.width === 'full'
                  ? 'w-full'
                  : config.width === 'third'
                    ? 'w-full lg:w-1/3'
                    : 'w-full lg:w-1/2'
              }`}
            >
              <Component />
            </div>
          )}
        </PluginSlot>
      </div>
    </div>
  );
};

export default HomePage;
