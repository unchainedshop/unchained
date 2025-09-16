import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import useAssortmentFilters from '../hooks/useAssortmentFilters';
import useRemoveAssortmentFilter from '../hooks/useRemoveAssortmentFilter';
import AssortmentFiltersList from './AssortmentFiltersList';
import AssortmentFiltersForm from './AssortmentFiltersForm';
import Loading from '../../common/components/Loading';
import useReorderAssortmentFilters from '../hooks/useReorderAssortmentFilters';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';

const AssortmentFilters = ({ assortmentId }) => {
  const { formatMessage } = useIntl();
  const { assortmentFilters, loading } = useAssortmentFilters({ assortmentId });
  const { setModal } = useModal();
  const { removeAssortmentFilter } = useRemoveAssortmentFilter();
  const { reorderAssortmentFilters } = useReorderAssortmentFilters();

  const items = assortmentFilters?.map((filter) => filter._id);

  const onRemoveFilter = async (assortmentFilterId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_assortment_filter_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this language? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeAssortmentFilter({ assortmentFilterId });
          toast.success(
            formatMessage({
              id: 'assortment_filter_deleted',
              defaultMessage: 'Assortment filter deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_filter',
          defaultMessage: 'Delete filter',
        })}
      />,
    );
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      const sortedItems = newItems.map((id, index) => ({
        assortmentFilterId: id,
        sortKey: index,
      }));

      try {
        await reorderAssortmentFilters({ sortKeys: sortedItems });
        toast.success(
          formatMessage({
            id: 'link_reorder',
            defaultMessage: 'Link reorder successfully',
          }),
        );
      } catch (error) {
        toast.error(
          formatMessage({
            id: 'fail_reorder',
            defaultMessage: 'Reordering failed, Try again!',
          }),
        );
      }
    } else {
      toast.info(
        formatMessage({
          id: 'reorder_original',
          defaultMessage: 'Reorder to original location',
        }),
      );
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <>
      <SelfDocumentingView
        documentationLabel={formatMessage({
          id: 'assortment_filters_form_header',
          defaultMessage: 'Filters',
        })}
        className="mt-2 lg:mt-5"
        documentation={
          <FormattedMessage
            id="assortment_filter_form_description"
            defaultMessage="<ul> <li>Assign filters that will be applied for the assortment </li>
      </ul>"
            values={{
              ul: (chunk) => <ul className="space-y-2">{chunk} </ul>,
              li: (chunk) => (
                <li key={Math.random()} className="text-sm">
                  {chunk}{' '}
                </li>
              ),
              strong: (chunk) => (
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {chunk}
                </strong>
              ),
            }}
          />
        }
      >
        <AssortmentFiltersForm assortmentId={assortmentId} />
      </SelfDocumentingView>
      <SelfDocumentingView
        documentationLabel={formatMessage({
          id: 'assortment_filters_header',
          defaultMessage: 'Assortment filters',
        })}
        className="sm:mt-4"
        documentation={
          <FormattedMessage
            id="assortment_filter_list_description"
            defaultMessage="<ul> <li>All filters that are applied when searching for this assortment </li>
            <li> Drag and drop list items to sort filters order </li>
          </ul>"
            values={{
              ul: (chunk) => <ul className="space-y-2">{chunk} </ul>,
              li: (chunk) => (
                <li key={Math.random()} className="text-sm">
                  {chunk}{' '}
                </li>
              ),
              strong: (chunk) => (
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {chunk}
                </strong>
              ),
            }}
          />
        }
      >
        {loading ? (
          <div className="ml-auto shadow-sm dark:shadow-none w-full md:col-span-2">
            <Loading />
          </div>
        ) : (
          <div className="ml-auto shadow-sm dark:shadow-none w-full md:col-span-2 bg-white dark:bg-slate-800">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              id="assortment-filter"
            >
              <AssortmentFiltersList
                filters={assortmentFilters}
                onRemoveFilter={onRemoveFilter}
                items={items}
              />
            </DndContext>
          </div>
        )}
      </SelfDocumentingView>
    </>
  );
};

export default AssortmentFilters;
