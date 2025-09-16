import { useIntl } from 'react-intl';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import NoData from '../../common/components/NoData';
import AssortmentFiltersListItem from './AssortmentFiltersListItem';
import { IFilter } from '../../../gql/types';

const AssortmentFiltersList = ({ filters, onRemoveFilter, items }) => {
  const { formatMessage } = useIntl();
  return filters?.length ? (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div className="space-y-4 py-3 px-6 rounded-sm transition-[background-color] ease-in-out delay-200">
        {items.map((id) => {
          const filter = Object.values(filters as IFilter).find(
            (fl) => fl._id === id,
          );
          return (
            <AssortmentFiltersListItem
              id={id}
              key={filter._id}
              link={filter}
              onDelete={onRemoveFilter}
            />
          );
        })}
      </div>
    </SortableContext>
  ) : (
    <NoData
      message={formatMessage({
        id: 'filters',
        defaultMessage: 'Filters',
      })}
    />
  );
};

export default AssortmentFiltersList;
