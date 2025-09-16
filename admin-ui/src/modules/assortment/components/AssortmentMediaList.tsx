import React from 'react';
import { useIntl } from 'react-intl';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import NoData from '../../common/components/NoData';
import AssortmentMediaListItem from './AssortmentMediaListItem';
import { IAssortmentMedia } from '../../../gql/types';
import useApp from '../../common/hooks/useApp';

const AssortmentMediaList = ({ medias = [], onDeleteMedia, items = [] }) => {
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();

  // Safety check for required components
  if (!SortableContext || !AssortmentMediaListItem || !NoData) {
    console.error('Required components not loaded in AssortmentMediaList:', {
      SortableContext: !!SortableContext,
      AssortmentMediaListItem: !!AssortmentMediaListItem,
      NoData: !!NoData,
    });
    return (
      <div className="rounded-md lg:col-span-6">
        <div className="mx-auto max-w-7xl overflow-hidden">
          <div className="flex items-center justify-center p-8">
            <div className="text-rose-500">
              Media list component loading error. Please refresh the page.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md lg:col-span-6">
      <div className="mx-auto max-w-7xl overflow-hidden">
        <h2 className="sr-only">
          {formatMessage({
            id: 'assortment_media',
            defaultMessage: 'Assortment Media',
          })}
        </h2>

        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul className="space-y-4 transition-[background-color] ease-in-out delay-200">
            {medias.length ? (
              items
                .map((id) => {
                  const media = Object.values(
                    medias as IAssortmentMedia[],
                  ).find((md) => md._id === id);

                  // Safety check to ensure media exists
                  if (!media) {
                    console.warn(
                      `Media with ID ${id} not found in medias array`,
                    );
                    return null;
                  }

                  return (
                    <AssortmentMediaListItem
                      id={id}
                      key={media._id}
                      media={media}
                      locale={selectedLocale}
                      onDelete={onDeleteMedia}
                    />
                  );
                })
                .filter(Boolean) // Remove null entries
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
  );
};

export default AssortmentMediaList;
