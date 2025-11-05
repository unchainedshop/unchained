import {
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  LockClosedIcon,
  StarIcon,
  PuzzlePieceIcon,
  ShoppingCartIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/20/solid';
import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import DisplayExtendedFields from '../../common/components/DisplayExtendedFields';
import DisplayUserLastLogs from '../../common/components/DisplayUserLastLogs';
import Loading from '../../common/components/Loading';
import Tab from '../../common/components/Tab';
import UserProductReviews from './UserProductReviews';
import AccountView from './AccountView';
import PaymentCredentialsView from './PaymentCredentialsView';
import ProfileView from './ProfileView';
import UserEnrollments from './UserEnrollments';
import UserOrders from './UserOrders';
import UserQuotations from './UserQuotations';
import UserTokens from './UserTokens';
import useAuth from '../../Auth/useAuth';

const GetCurrentTab = ({ user, selectedView, ...extendedData }) => {
  if (!user) return <Loading />;
  if (selectedView === 'profile') return <ProfileView {...user} />;
  if (selectedView === 'account') return <AccountView {...user} />;
  if (selectedView === 'orders') return <UserOrders {...user} />;
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
  return <ProfileView {...user} />;
};
const UserSettings = ({ user, extendedData }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

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
    {
      id: 'orders',
      title: formatMessage({ id: 'orders', defaultMessage: 'Orders' }),
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
    {
      id: 'payment_credentials',
      title: formatMessage({
        id: 'payment_credentials',
        defaultMessage: 'Payment credentials',
      }),
      Icon: <CreditCardIcon className="h-5 w-5" />,
    },
    {
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
    {
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
  ].filter(Boolean);
  return (
    <Tab tabItems={userProfileSettingOptions} defaultTab="profile">
      <GetCurrentTab user={user} {...extendedData} />
    </Tab>
  );
};

export default UserSettings;
