import { useIntl } from 'react-intl';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import NoData from '../../common/components/NoData';
import AssortmentProductListItem from './AssortmentProductListItem';
import { IProduct } from '../../../gql/types';

const AssortmentProductsList = ({ products, onRemoveProduct, items }) => {
  const { formatMessage } = useIntl();
  return products.length ? (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div className="block py-3 rounded-sm px-6 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none transition-[background-color] ease-in-out delay-200">
        {items.map((id) => {
          const product = Object.values(products as IProduct[]).find(
            (pr) => pr._id === id,
          );
          return (
            <AssortmentProductListItem
              id={id}
              key={product._id}
              link={product}
              onDelete={onRemoveProduct}
            />
          );
        })}
      </div>
    </SortableContext>
  ) : (
    <NoData
      message={formatMessage({
        id: 'assigned_products',
        defaultMessage: 'Assigned Products',
      })}
    />
  );
};

export default AssortmentProductsList;
