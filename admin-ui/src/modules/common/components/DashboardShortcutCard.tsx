import React from 'react';
import { useRouter } from 'next/router';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import Button from './Button';
import useAuth from '../../Auth/useAuth';

const DashboardShortcutCard = () => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const canCreateProduct = hasRole('createProduct');
  const canCreateUser = hasRole('createUser');
  const canCreateAssortment = hasRole('createAssortment');
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {formatMessage({ id: 'shortcuts', defaultMessage: 'Shortcuts' })}
      </h3>
      <div className="grid xl:grid-cols-3 gap-3">
        {canCreateProduct && (
          <Button
            onClick={() => router.push('/products/new')}
            icon={<PlusIcon className="w-5 h-5" />}
            variant="primary"
            size="lg"
            text={formatMessage({ id: 'product', defaultMessage: 'Product' })}
          />
        )}
        {canCreateUser && (
          <Button
            onClick={() => router.push('/users/new')}
            icon={<PlusIcon className="w-5 h-5" />}
            variant="primary"
            size="lg"
            text={formatMessage({ id: 'user', defaultMessage: 'User' })}
          />
        )}
        {canCreateAssortment && (
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
