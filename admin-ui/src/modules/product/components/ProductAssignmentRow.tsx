import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { ISortDirection } from '../../../gql/types';
import DeleteButton from '../../common/components/DeleteButton';
import UnchainedSelect from '../../common/components/UnchainedSelect';
import deBounce from '../../common/utils/deBounce';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import useAddProductAssignment from '../hooks/useAddProductAssignment';
import useProducts from '../hooks/useProducts';
import useRemoveProductAssignment from '../hooks/useRemoveProductAssignment';
import {
  getRowVector,
  normalizeProduct,
} from '../utils/productAssignment.utils';
import Table from '../../common/components/Table';
import Link from 'next/link';
import generateUniqueId from '../../common/utils/getUniqueId';
import { SparklesIcon } from '@heroicons/react/24/outline';
import Button from '../../common/components/Button';
import ProductAssignmentScaffoldForm from './ProductAssignmentScaffoldForm';
import useAuth from '../../Auth/useAuth';

const ProductAssignmentRow = ({
  columns,
  variationProduct,
  product,
  loading,
  disabled,
  proxyId,
  columnKeys,
}) => {
  const { formatMessage } = useIntl();

  const [queryString, setQueryString] = useState('');
  const { addProductAssignment } = useAddProductAssignment();
  const { removeProductAssignment } = useRemoveProductAssignment();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { products } = useProducts({
    queryString,
    limit: 50,
    sort: [{ key: 'created', value: ISortDirection.Desc }],
  });
  const vectors = useMemo(
    () =>
      columns
        .map((optionValue, index) =>
          getRowVector(optionValue, index, columnKeys),
        )
        .filter(({ value }) => value),
    [columns, columnKeys],
  );

  const handleProductAssignment = useCallback(
    async ({ value: productId }) => {
      await addProductAssignment({ proxyId, productId, vectors });
    },
    [vectors, addProductAssignment, proxyId],
  );

  const handleRemoveAssignment = useCallback(async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_product_assignment',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this assignment? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeProductAssignment({ proxyId, vectors });
        }}
        okText={formatMessage({
          id: 'delete_variation_assignment',
          defaultMessage: 'Delete assignment',
        })}
      />,
    );
  }, [proxyId, vectors, formatMessage, setModal, removeProductAssignment]);

  const debouncedQuery = useMemo(() => deBounce(200)(setQueryString), []);
  const showMismatchWarning =
    !variationProduct && product?.variations?.length !== columns?.length;

  const selectOptions = useMemo(() => {
    return (
      products
        ?.map(normalizeProduct)
        .filter(({ value }) => value !== proxyId) || []
    );
  }, [products, proxyId]);

  const scaffoldVariationProduct = async () => {
    await setModal(
      <ProductAssignmentScaffoldForm
        proxyProduct={product}
        vectors={vectors}
        onSuccess={() => {
          setModal(null);
        }}
      />,
    );
  };

  return (
    <Table.Row>
      {columns.map((columnText, index) => (
        <Table.Cell key={`${columnText}`} className="font-medium">
          {columnText}
        </Table.Cell>
      ))}

      <Table.Cell>
        {variationProduct ? (
          <div className="flex items-center">
            <Link href={`/products?slug=${generateUniqueId(variationProduct)}`}>
              <span className="text-green-700 dark:text-green-300 font-medium">
                {variationProduct?.texts?.title}
              </span>
            </Link>
          </div>
        ) : showMismatchWarning ? (
          <div className="mt-1 text-sm text-rose-600 italic">
            {formatMessage({
              id: 'assign_product_needs_variations',
              defaultMessage:
                'Please configure all variation options before assigning a product.',
            })}
          </div>
        ) : (
          <div className="relative w-full">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <UnchainedSelect
                  name={`productId`}
                  placeholder={formatMessage({
                    id: 'search_product',
                    defaultMessage: 'Search product',
                  })}
                  isLoading={loading}
                  isDisabled={disabled}
                  onChange={handleProductAssignment}
                  onInputChange={debouncedQuery}
                  options={selectOptions}
                  className="mt-1 w-full py-2 text-sm font-medium text-slate-500"
                />
              </div>
              {hasRole('manageProducts') && (
                <Button onClick={scaffoldVariationProduct}>
                  <SparklesIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        {variationProduct && variationProduct._id && (
          <DeleteButton onClick={handleRemoveAssignment} />
        )}
      </Table.Cell>
    </Table.Row>
  );
};

export default ProductAssignmentRow;
