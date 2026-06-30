import React from 'react';
import { IRoleAction } from '../../../gql/types';

import { useRouter } from 'next/router';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import Button from '@/components/ui/Button';
import useAuth from '../../Auth/useAuth';

const DashboardShortcutCard = () => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const router = useRouter();

  return (
    <div className="bg-surface rounded-lg border border-border-subtle p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {formatMessage({ id: 'shortcuts', defaultMessage: 'Shortcuts' })}
      </h3>
      <div className="grid xl:grid-cols-3 gap-3">
        {hasRole(IRoleAction.ManageProducts) && (
          <Button
            onClick={() => router.push('/products/new')}
            icon={<PlusIcon className="w-5 h-5" />}
            variant="primary"
            size="lg"
            text={formatMessage({ id: 'product', defaultMessage: 'Product' })}
          />
        )}
        {hasRole(IRoleAction.CreateUser) && (
          <Button
            onClick={() => router.push('/users/new')}
            icon={<PlusIcon className="w-5 h-5" />}
            variant="primary"
            size="lg"
            text={formatMessage({ id: 'user', defaultMessage: 'User' })}
          />
        )}
        {hasRole(IRoleAction.ManageAssortments) && (
          <Button
            onClick={() => router.push('/assortments/new')}
            icon={<PlusIcon className="w-5 h-5" />}
            variant="primary"
            size="lg"
            text={formatMessage({
              id: 'assortment',
              defaultMessage: 'Assortment',
            })}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardShortcutCard;
