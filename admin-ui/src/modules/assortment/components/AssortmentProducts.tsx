import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';

import useAssortmentProducts from '../hooks/useAssortmentProducts';
import useRemoveAssortmentProduct from '../hooks/useRemoveAssortmentProduct';
import AssortmentProductForm from './AssortmentProductForm';
import AssortmentProductList from './AssortmentProductList';
import Loading from '../../common/components/Loading';
import useReorderAssortmentProducts from '../hooks/useReorderAssortmentProducts';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import useAuth from '../../Auth/useAuth';

const AssortmentProducts = ({ assortmentId }) => {
  const { formatMessage } = useIntl();
  const { linkedProducts, loading } = useAssortmentProducts({ assortmentId });
  const { setModal } = useModal();
  const { hasRole } = useAuth();
  const { removeAssortmentProduct } = useRemoveAssortmentProduct();
  const { reorderAssortmentProducts } = useReorderAssortmentProducts();

  const items = linkedProducts?.map((product) => product._id);

  const onRemoveProduct = async (assortmentProductId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_product_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it and it is nonreversible. Are you sure you want to delete this product? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeAssortmentProduct({ assortmentProductId });
          toast.success(
            formatMessage({
              id: 'product_deleted',
              defaultMessage: 'Product deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_product',
          defaultMessage: 'Delete Product',
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
        assortmentProductId: id,
        sortKey: index,
      }));

      try {
        await reorderAssortmentProducts({ sortKeys: sortedItems });
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
      {hasRole('manageAssortments') && (
        <SelfDocumentingView
          documentationLabel={formatMessage({
            id: 'assortment_product_form_header',
            defaultMessage: 'Products',
          })}
          className="mt-2 lg:mt-5"
          documentation={
            <FormattedMessage
              id="assortment_product_form_description"
              defaultMessage="<ul> <li>Products that belong to this assortment </li>
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
          <AssortmentProductForm assortmentId={assortmentId} />
        </SelfDocumentingView>
      )}

      <SelfDocumentingView
        documentationLabel={formatMessage({
          id: 'assortment_products_header',
          defaultMessage: 'Assortment product',
        })}
        className="sm:mt-4"
        documentation={
          <FormattedMessage
            id="assortment_product_list_description"
            defaultMessage="<ul> <li>All products that belong to this assortment</li>
            <li> Drag and drop list items to sort products order </li>
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
          <div className="ml-auto w-full md:col-span-2 my-auto">
            <Loading />
          </div>
        ) : (
          <div className="ml-auto my-auto w-full rounded-sm shadow-sm dark:shadow-none md:col-span-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              id="assortment-product"
            >
              <AssortmentProductList
                products={linkedProducts}
                onRemoveProduct={onRemoveProduct}
                items={items}
              />
            </DndContext>
          </div>
        )}
      </SelfDocumentingView>
    </>
  );
};

export default AssortmentProducts;
