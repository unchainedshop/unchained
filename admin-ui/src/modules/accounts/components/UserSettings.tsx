import {
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  LockClosedIcon,
  StarIcon,
  PuzzlePieceIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/20/solid';
import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';
import { usePlugins } from '../../plugins/PluginContext';
import PluginSlot from '../../plugins/PluginSlot';

import DisplayExtendedFields from '../../common/components/DisplayExtendedFields';
import DisplayUserLastLogs from '../../common/components/DisplayUserLastLogs';
import Loading from '@/components/ui/Loading';
import Tab from '@/components/ui/Tab';
import UserProductReviews from './UserProductReviews';
import AccountView from './AccountView';
import PaymentCredentialsView from './PaymentCredentialsView';
import ProfileView from './ProfileView';
import UserCart from './UserCart';
import UserEnrollments from './UserEnrollments';
import UserOrders from './UserOrders';
import UserQuotations from './UserQuotations';
import UserTokens from './UserTokens';
import useAuth from '../../Auth/useAuth';
import useCurrentUser from '../hooks/useCurrentUser';

const GetCurrentTab = ({ user, selectedView, ...extendedData }) => {
  if (!user) return <Loading />;
  if (selectedView === 'profile') return <ProfileView {...user} />;
  if (selectedView === 'account') return <AccountView {...user} />;
  if (selectedView === 'orders') return <UserOrders {...user} />;
  if (selectedView === 'cart') return <UserCart {...user} />;
  if (selectedView === 'quotations') return <UserQuotations {...user} />;
  if (selectedView === 'enrollments') return <UserEnrollments {...user} />;
  if (selectedView === 'reviews') return <UserProductReviews {...user} />;

  if (selectedView === 'payment_credentials')
    return <PaymentCredentialsView {...user} />;
  if (selectedView === 'tokens') return <UserTokens {...user} />;
  if (selectedView === 'extended') {
    return <DisplayExtendedFields data={extendedData} />;
  }
  if (selectedView === 'logs') {
    return <DisplayUserLastLogs {...user} />;
  }
  if (selectedView?.startsWith('plugin:')) {
    const componentName = selectedView.replace('plugin:', '');
    return (
      <PluginSlot slot="user:tabs" entityId={user?._id}>
        {(Component, config) =>
          config.component === componentName ? (
            <Component entityId={user?._id} entity={user} />
          ) : null
        }
      </PluginSlot>
    );
  }
  return <ProfileView {...user} />;
};
const UserSettings = ({ user, extendedData }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { currentUser } = useCurrentUser();
  const isOwnUser = currentUser?._id === user?._id;
  const { getSlotPlugins } = usePlugins();

  const userProfileSettingOptions = [
    {
      id: 'profile',
      title: formatMessage({ id: 'profile', defaultMessage: 'Profile' }),
      Icon: <UserIcon className="h-5 w-5" />,
    },
    {
      id: 'account',
      title: formatMessage({ id: 'account', defaultMessage: 'Account' }),
      Icon: <LockClosedIcon className="h-5 w-5" />,
    },
    (isOwnUser || hasRole(IRoleAction.ViewUserOrders)) && {
      id: 'orders',
      title: formatMessage({ id: 'orders', defaultMessage: 'Orders' }),
      Icon: <ShoppingBagIcon className="h-5 w-5" />,
    },
    (isOwnUser || hasRole(IRoleAction.ViewUserOrders)) && {
      id: 'cart',
      title: formatMessage({ id: 'cart', defaultMessage: 'Cart' }),
      Icon: <ShoppingCartIcon className="h-5 w-5" />,
    },
    hasRole(IRoleAction.ViewUserQuotations) && {
      id: 'quotations',
      title: formatMessage({
        id: 'quotations',
        defaultMessage: 'Quotations',
      }),
      Icon: <BanknotesIcon className="h-5 w-5" />,
    },
    hasRole(IRoleAction.ViewUserEnrollments) && {
      id: 'enrollments',
      title: formatMessage({
        id: 'enrollments',
        defaultMessage: 'Enrollments',
      }),
      Icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
    },
    (isOwnUser || hasRole(IRoleAction.ViewUserPrivateInfos)) && {
      id: 'payment_credentials',
      title: formatMessage({
        id: 'payment_credentials',
        defaultMessage: 'Payment credentials',
      }),
      Icon: <CreditCardIcon className="h-5 w-5" />,
    },
    (isOwnUser || hasRole(IRoleAction.ViewUserTokens)) && {
      id: 'tokens',
      title: formatMessage({
        id: 'tokens',
        defaultMessage: 'Tokens',
      }),
      Icon: <CurrencyDollarIcon className="h-5 w-5" />,
    },
    hasRole(IRoleAction.ViewUserProductReviews) && {
      id: 'reviews',
      title: formatMessage({
        id: 'reviews',
        defaultMessage: 'Reviews',
      }),
      Icon: <StarIcon className="h-5 w-5" />,
    },
    (isOwnUser || hasRole(IRoleAction.ViewUserPrivateInfos)) && {
      id: 'logs',
      title: formatMessage({
        id: 'user-activities',
        defaultMessage: 'Activity',
      }),
      Icon: <ClipboardDocumentIcon className="h-5 w-5" />,
    },
    extendedData !== null && {
      id: 'extended',
      title: formatMessage({
        id: 'extended-fields',
        defaultMessage: 'Extended',
      }),
      Icon: <PuzzlePieceIcon className="h-5 w-5" />,
    },
    ...getSlotPlugins('user:tabs').map(({ config }) => ({
      id: `plugin:${config.component}`,
      title: config.label,
      Icon: <PuzzlePieceIcon className="h-5 w-5" />,
    })),
  ].filter(Boolean);
  return (
    <Tab tabItems={userProfileSettingOptions} defaultTab="profile">
      <GetCurrentTab user={user} {...extendedData} />
    </Tab>
  );
};

export default UserSettings;
