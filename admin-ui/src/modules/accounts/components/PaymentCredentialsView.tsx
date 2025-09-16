import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
import NoData from '../../common/components/NoData';

const PaymentCredentialsView = ({ paymentCredentials }) => {
  const { formatMessage } = useIntl();

  return (
    <div className="flex w-full min-w-full flex-row flex-nowrap divide-y divide-slate-200 overflow-hidden rounded-lg text-slate-900 dark:text-slate-200 shadow-sm dark:shadow-none">
      {paymentCredentials?.length ? (
        <ul className="-my-5 divide-y divide-slate-200 dark:divide-slate-700">
          {(paymentCredentials || []).map(
            ({ _id: paymentCredentialsId, isPreferred, isActive, isValid }) => (
              <li className="py-4" key={paymentCredentialsId}>
                <div className=" flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{paymentCredentialsId}</p>
                    {isPreferred && (
                      <p className="truncate text-sm text-slate-500 dark:text-slate-200">
                        <Badge
                          text={formatMessage({
                            id: 'preferred',
                            defaultMessage: 'Preferred',
                          })}
                          color="sky"
                          square
                        />
                      </p>
                    )}
                  </div>
                  <div>
                    {isActive ? (
                      <Badge
                        text={formatMessage({
                          id: 'active',
                          defaultMessage: 'Active',
                        })}
                        color="emerald"
                        square
                      />
                    ) : (
                      <Badge
                        text={formatMessage({
                          id: 'in_active',
                          defaultMessage: 'In-Active',
                        })}
                        color="amber"
                        square
                      />
                    )}
                  </div>
                  <div>
                    {isValid ? (
                      <Badge
                        text={formatMessage({
                          id: 'valid',
                          defaultMessage: 'Valid',
                        })}
                        color="emerald"
                        square
                      />
                    ) : (
                      <Badge
                        text={formatMessage({
                          id: 'in_valid',
                          defaultMessage: 'InValid',
                        })}
                        color="red"
                        square
                      />
                    )}
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      ) : (
        <NoData
          message={formatMessage({
            id: 'payment_credentials',
            defaultMessage: 'Payment credentials',
          })}
        />
      )}
    </div>
  );
};

export default PaymentCredentialsView;
