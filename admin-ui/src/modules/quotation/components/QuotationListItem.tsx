import Link from 'next/link';
import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
import MediaAvatar from '../../common/components/MediaAvatar';
import Table from '../../common/components/Table';
import formatUsername from '../../common/utils/formatUsername';
import generateUniqueId from '../../common/utils/getUniqueId';
import useFormatDateTime from '../../common/utils/useFormatDateTime';

const QUOTATION_STATUS = {
  REQUESTED: 'orange',
  PROCESSING: 'yellow',
  PROPOSED: 'cyan',
  REJECTED: 'amber',
  FULLFILLED: 'emerald',
};

const QuotationListItem = ({ quotation, showUser }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex items-center text-sm ">
          <Link
            href={`/quotations?quotationId=${quotation?._id}`}
            className="font-medium text-slate-800 dark:text-slate-700"
          >
            {quotation?.quotationNumber || quotation?._id}
          </Link>
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm ">
          {formatDateTime(quotation.created, {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm ">
          {quotation.isExpired ? (
            <Badge
              text={formatMessage({
                id: 'expired',
                defaultMessage: 'Expired',
              })}
              color="amber"
            />
          ) : (
            formatDateTime(quotation?.expires, {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          )}
        </div>
      </Table.Cell>
      {showUser && (
        <Table.Cell>
          <Link
            href={`/users?userId=${quotation?.user._id}`}
            className="flex items-center text-sm text-slate-800 dark:text-slate-700 hover:text-decoration"
          >
            <MediaAvatar file={quotation?.user?.avatar} className="mr-2" />
            <span className="font-medium ml-2">
              {formatUsername(quotation?.user)}
            </span>
          </Link>
        </Table.Cell>
      )}
      <Table.Cell>
        <div>
          <Link
            href={`/products?slug=${generateUniqueId(quotation.product)}`}
            className="flex items-center text-sm text-slate-800 dark:text-slate-700 hover:text-decoration"
          >
            <MediaAvatar
              file={quotation.product?.media[0]?.file}
              className="mr-3"
            />
            <span className="font-medium ml-2">
              {quotation?.product.texts.title}
            </span>
          </Link>
        </div>
      </Table.Cell>

      <Table.Cell>
        <Badge
          text={quotation?.status}
          color={QUOTATION_STATUS[quotation?.status]}
          square
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default QuotationListItem;
