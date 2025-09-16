import { useIntl } from 'react-intl';
import { Fragment } from 'react';

import Table from '../../common/components/Table';
import Badge from '../../common/components/Badge';
import { useFormatPrice } from '../../common/utils/utils';
import NoData from '../../common/components/NoData';

const triggerColor = {
  SYSTEM: 'teal',
  USER: 'indigo',
};

const DiscountList = ({ discounts }) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();
  return (
    <div className="flex flex-auto flex-col">
      <h2 className="text-2xl">
        {formatMessage({
          id: 'discount_information',
          defaultMessage: 'Discounts',
        })}
      </h2>
      <div className="mt-2">
        {discounts?.length ? (
          <Table className="min-w-full ">
            {(discounts || [])?.map((discount) => (
              <Table.Row key={discount._id} header>
                <Table.Cell>
                  {formatMessage({
                    id: 'code',
                    defaultMessage: 'Code',
                  })}
                </Table.Cell>

                <Table.Cell>
                  {formatMessage({
                    id: 'discount_amount',
                    defaultMessage: 'Discount Amount',
                  })}
                </Table.Cell>
              </Table.Row>
            ))}
            {(discounts || [])?.map((discount) => (
              <Fragment key={discount._id}>
                <Table.Row>
                  <Table.Cell>
                    <div className="flex items-center text-sm text-slate-900">
                      {discount.code ? discount.code : 'n/a'}
                      <span className="mr-2 inline-block rounded-full py-1 text-xs font-semibold leading-5">
                        <Badge
                          text={discount.trigger}
                          color={triggerColor[discount.trigger]}
                          square
                        />
                      </span>
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className="flex items-center text-sm text-slate-900">
                      {formatPrice(discount.total)}
                    </div>
                  </Table.Cell>
                </Table.Row>
              </Fragment>
            ))}
          </Table>
        ) : (
          <NoData
            message={formatMessage({
              id: 'discounts',
              defaultMessage: 'Discounts',
            })}
          />
        )}
      </div>
    </div>
  );
};

export default DiscountList;
