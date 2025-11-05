import { FormattedMessage, useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import useCurrentUser from '../hooks/useCurrentUser';
import ChangePassword from './ChangePassword';
import EmailAddresses from './EmailAddresses';
import SetPassword from './SetPassword';
import UserNameView from './UserNameView';
import UserRolesView from './UserRolesView';
import UserTagsView from './UserTagsView';
import UserWebAuthCredentials from './UserWebAuthCredentials';
import Web3Addresses from './Web3Addresses';

const AccountView = ({
  _id,
  emails,
  web3Addresses,
  username,
  roles,
  tags,
  isInitialPassword,
  primaryEmail,
}) => {
  const { formatMessage } = useIntl();
  const { currentUser } = useCurrentUser();
  const { hasRole } = useAuth();
  return (
    <>
      <SelfDocumentingView
        documentationLabel={formatMessage({
          id: 'account',
          defaultMessage: 'Account',
        })}
        documentation={formatMessage({
          id: 'account_notice',
          defaultMessage:
            'This information will be displayed publicly so be careful what you share.',
        })}
      >
        <div className="overflow-hidden rounded-md p-3 shadow-sm bg-white dark:bg-slate-800 sm:p-6">
          <UserNameView username={username} _id={_id} />
        </div>
      </SelfDocumentingView>
      <SelfDocumentingView
        documentationLabel={formatMessage({
          id: 'email_addresses',
          defaultMessage: 'Email addresses',
        })}
      >
        <div className="rounded-md border-slate-300 dark:border-slate-800 shadow-xs">
          <EmailAddresses
            emails={emails}
            enableVerification
            userId={_id}
            emailBodyContainer="rounded-md shadow-sm"
          />
        </div>
      </SelfDocumentingView>
      {currentUser?._id === _id && (
        <SelfDocumentingView
          documentationLabel={formatMessage({
            id: 'web3_addresses',
            defaultMessage: 'Web3 addresses',
          })}
          documentation={
            <FormattedMessage
              id="web3_address_verify_link"
              defaultMessage="<p> Go to <a> etherscan </a> to verify address  </p>"
              values={{
                p: (chunk) => <p className="text-sm">{chunk}</p>,
                a: (chunk) => (
                  <a
                    href="https://etherscan.io/verifiedSignatures"
                    target="__blank"
                    className="text-sm text-slate-900 hover:text-sky-600 dark:text-slate-800 dark:hover:text-slate-400"
                  >
                    {chunk}
                  </a>
                ),
              }}
            />
          }
        >
          <div className="rounded-md border-slate-300 dark:border-slate-800 shaodw-sm">
            <Web3Addresses web3Addresses={web3Addresses} />
          </div>
        </SelfDocumentingView>
      )}

      <SelfDocumentingView
        documentationLabel={formatMessage({
          id: 'tags',
          defaultMessage: 'Tags',
        })}
      >
        <div className="my-2 rounded-md px-4 py-5 shadow-sm bg-white dark:bg-slate-800 sm:p-6">
          <UserTagsView tags={tags} userId={_id} />
        </div>
      </SelfDocumentingView>

      {hasRole(IRoleAction.ManageUsers) ? (
        <SelfDocumentingView
          documentationLabel={formatMessage({
            id: 'roles',
            defaultMessage: 'Roles',
          })}
        >
          <div className="overflow-hidden rounded-md border-b bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-800 px-4 py-5 shadow-sm sm:p-6">
            <UserRolesView roles={roles} userId={_id} />
          </div>
        </SelfDocumentingView>
      ) : null}

      {hasRole(IRoleAction.ManageUsers) && currentUser?._id !== _id ? (
        <SelfDocumentingView
          documentationLabel={formatMessage({
            id: 'set_password',
            defaultMessage: 'Set password',
          })}
        >
          <div className="overflow-hidden rounded-md border-b bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-800 shadow-sm">
            <SetPassword
              userId={_id}
              isInitialPassword={isInitialPassword}
              primaryEmail={primaryEmail}
            />
          </div>
        </SelfDocumentingView>
      ) : null}

      {currentUser?._id === _id && (
        <SelfDocumentingView
          documentationLabel={formatMessage({
            id: 'change_password',
            defaultMessage: 'Change password',
          })}
        >
          <div className="overflow-hidden rounded-md border-b bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-800 shadow-sm">
            <ChangePassword />
          </div>
        </SelfDocumentingView>
      )}

      {hasRole(IRoleAction.ManageUsers) && (
        <SelfDocumentingView
          documentationLabel={formatMessage({
            id: 'web_authentication',
            defaultMessage: 'Web Authentication',
          })}
        >
          <div className="text-end overflow-hidden rounded-md border-b bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-800 px-4 py-5 shadow-sm sm:p-6">
            <UserWebAuthCredentials userId={_id} />
          </div>
        </SelfDocumentingView>
      )}
    </>
  );
};

export default AccountView;
