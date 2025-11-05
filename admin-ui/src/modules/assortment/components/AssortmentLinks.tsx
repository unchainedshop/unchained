import { FormattedMessage, useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import { toast } from 'react-toastify';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Loading from '../../common/components/Loading';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import useAssortmentLinks from '../hooks/useAssortmentLinks';
import useRemoveAssortmentLink from '../hooks/useRemoveAssortmentLink';
import AssortmentLinkForm from './AssortmentLinkForm';
import AssortmentLinksList from './AssortmentLinksList';
import useReorderAssortmentLink from '../hooks/useReorderAssortmentLinks';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import useAuth from '../../Auth/useAuth';

const AssortmentLinks = ({ assortmentId }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { hasRole } = useAuth();
  const { linkedAssortments, loading } = useAssortmentLinks({ assortmentId });

  const { removeAssortmentLink } = useRemoveAssortmentLink();
  const { reorderAssortmentLink } = useReorderAssortmentLink();
  const items = linkedAssortments?.map((link) => link._id);

  const onRemoveLink = async (assortmentLinkId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_assortment_link',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this language? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeAssortmentLink({ assortmentLinkId });
          toast.success(
            formatMessage({
              id: 'assortment_link',
              defaultMessage: 'Link deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_link',
          defaultMessage: 'Delete link',
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
        assortmentLinkId: id,
        sortKey: index,
      }));

      try {
        await reorderAssortmentLink({ sortKeys: sortedItems });
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
      {hasRole(IRoleAction.ManageAssortments) && (
        <SelfDocumentingView
          documentationLabel={formatMessage({
            id: 'assortment_link_form_header',
            defaultMessage: 'Child assortments',
          })}
          className="mt-2 lg:mt-5"
          documentation={
            <FormattedMessage
              id="assortment_link_form_description"
              defaultMessage="<ul> <li>Assign assortment that are direct child of this assortment </li>
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
          <AssortmentLinkForm assortmentId={assortmentId} />
        </SelfDocumentingView>
      )}
      <SelfDocumentingView
        documentationLabel={formatMessage({
          id: 'assortment_links_header',
          defaultMessage: 'Assortment links',
        })}
        className="sm:mt-4"
        documentation={
          <FormattedMessage
            id="assortment_link_list_description"
            defaultMessage="<ul> <li>All assortments found on the assortment relation tree</li>
            <li> Drag and drop list items to sort assortment links </li>
         <li> Parents are assortments found in the ancestors tree on any level </li>
         <li> Descendants are assortments found in the children tree on any level </li> </ul>"
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
          <Loading />
        ) : (
          <div className="ml-auto shadow-sm dark:shadow-none dark:bg-slate-800 w-full md:col-span-2 bg-white">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              id="assortment-link"
            >
              <AssortmentLinksList
                currentAssortmentId={assortmentId}
                links={linkedAssortments || []}
                onRemoveLink={onRemoveLink}
                items={items}
              />
            </DndContext>
          </div>
        )}
      </SelfDocumentingView>
    </>
  );
};

export default AssortmentLinks;
