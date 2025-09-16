import { useIntl } from 'react-intl';

import NoData from '../../common/components/NoData';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import useFormatDateTime from '../../common/utils/useFormatDateTime';

const SubscriptionList = ({ periods }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <section className="mt-3">
      {periods?.length ? (
        <Table className="mt-0 min-w-full rounded-t-none">
          {(periods || [])?.map((period) => (
            <Table.Row
              key={`${period.start}${period.end}`}
              className="bg-white "
              header
            >
              <Table.Cell>
                {formatMessage({
                  id: 'order',
                  defaultMessage: 'Order',
                })}
              </Table.Cell>

              <Table.Cell className="text-left">
                {formatMessage({
                  id: 'start',
                  defaultMessage: 'Start',
                })}
              </Table.Cell>

              <Table.Cell>
                {formatMessage({
                  id: 'end',
                  defaultMessage: 'End',
                })}
              </Table.Cell>
            </Table.Row>
          ))}

          {(periods || [])?.map((period) => (
            <Table.Row key={`${period.start}`}>
              <Table.Cell>
                <div className="flex items-center text-sm text-slate-900">
                  {period?.order?.orderNumber
                    ? period?.order?.orderNumber
                    : 'n/a'}
                  {period?.isTrial && (
                    <Badge
                      text={formatMessage({
                        id: 'trial',
                        defaultMessage: 'Trial',
                      })}
                      color="pink"
                      className="ml-2 rounded-full py-1 text-sm font-semibold leading-5"
                      square
                    />
                  )}
                </div>
              </Table.Cell>

              <Table.Cell>
                {formatDateTime(period?.start, {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}
              </Table.Cell>

              <Table.Cell>
                {formatDateTime(period?.end, {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table>
      ) : (
        <NoData
          message={formatMessage({
            id: 'subscription_message',
            defaultMessage: 'Subscription',
          })}
        />
      )}
    </section>
  );
};

export default SubscriptionList;
