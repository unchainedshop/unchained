import { useIntl } from 'react-intl';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import NoData from '../../common/components/NoData';

import ProductMediaListItem from './ProductMediaListItem';
import { IProductMedia } from '../../../gql/types';

const ProductMediaList = ({ medias, onDeleteMedia, items }) => {
  const { formatMessage } = useIntl();

  return (
    <div className="rounded-md lg:col-span-6 px-6">
      <div className="mx-auto overflow-hidden">
        <h2 className="sr-only">
          {formatMessage({
            id: 'product_media',
            defaultMessage: 'Product Media',
          })}
        </h2>

        <div className="flow-root">
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3 rounded-md transition-[background-color] ease-in-out delay-200 ">
              {medias?.length ? (
                items.map((id) => {
                  const media = Object.values(medias as IProductMedia[]).find(
                    (md) => md._id === id,
                  );
                  return (
                    <ProductMediaListItem
                      id={id}
                      key={media._id}
                      media={media}
                      onDelete={onDeleteMedia}
                    />
                  );
                })
              ) : (
                <NoData
                  message={formatMessage({
                    id: 'media',
                    defaultMessage: 'Media',
                  })}
                />
              )}
            </ul>
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

export default ProductMediaList;
