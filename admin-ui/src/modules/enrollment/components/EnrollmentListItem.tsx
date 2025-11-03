import Link from 'next/link';
import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';

import Table from '../../common/components/Table';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import generateUniqueId from '../../common/utils/getUniqueId';
import MediaAvatar from '../../common/components/MediaAvatar';
import formatUsername from '../../common/utils/formatUsername';

const ENROLLMENT_STATUS = {
  INITIAL: 'orange',
  PAUSED: 'yellow',
  TERMINATED: 'amber',
  ACTIVE: 'emerald',
};

const EnrollmentListItem = ({ enrollment, showUser }) => {
  const { formatMessage } = useIntl();

  const { formatDateTime } = useFormatDateTime();  

  return (
    <Table.Row>
      <Table.Cell>
        <div className="text-sm">
          <Link
            href={`/enrollments?enrollmentId=${enrollment._id}`}
            className="font-medium text-slate-800 dark:text-slate-700"
          >
            {enrollment?.enrollmentNumber || enrollment._id?.substr(0, 10)}
          </Link>
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm ">
          {formatDateTime(enrollment.created, {
            dateStyle: 'medium',
            timeStyle: 'medium',
          })}
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm ">
          {enrollment.isExpired ? (
            <Badge
              text={formatMessage({
                id: 'expired',
                defaultMessage: 'Expired',
              })}
              color="amber"
            />
          ) : (
            formatDateTime(enrollment.expires, {
              dateStyle: 'medium',
              timeStyle: 'medium',
            })
          )}
        </div>
      </Table.Cell>

      {showUser && enrollment.user && (
        <Table.Cell>
          <Link
            href={`/users?userId=${enrollment.user._id}`}
            className="flex items-center text-sm text-slate-800 dark:text-slate-700 hover:text-decoration"
          >
            <span className="inline-block h-9 w-9 rounded-full">
              <MediaAvatar file={enrollment?.user?.avatar} className="mr-3" />
            </span>
            <span className="ml-2">{formatUsername(enrollment.user)}</span>
          </Link>
        </Table.Cell>
      )}

      <Table.Cell>
        <Link
          href={`/products?slug=${generateUniqueId(enrollment.plan.product)}`}
          className="flex items-center text-sm text-slate-800 dark:text-slate-700 hover:text-decoration"
        >
          <MediaAvatar
            file={enrollment?.plan?.product?.media?.file}
            className="mr-3"
          />
          <span className="ml-2">
            {enrollment?.plan?.product?.texts?.title}
          </span>
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Badge
          text={enrollment?.status}
          color={ENROLLMENT_STATUS[enrollment.status]}
          square
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default EnrollmentListItem;
