import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import Badge from '../../common/components/Badge';
import MediaAvatar from '../../common/components/MediaAvatar';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import generateUniqueId from '../../common/utils/getUniqueId';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';

import useUpdateProduct from '../hooks/useUpdateProduct';
import useRemoveProduct from '../hooks/useRemoveProduct';
import { ProductStatusBadge } from './ProductStatusBadge';

const ProductListItem = ({
  product,
  showAvatar = false,
  hideSortIndex = false,
}) => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { updateProduct } = useUpdateProduct();
  const { removeProduct } = useRemoveProduct();

  const updateProductSequence = async (e) => {
    if (e.target.value)
      await updateProduct({
        productId: product?._id,
        product: {
          sequence: parseInt(e.target.value, 10),
        },
      });
  };

  const handleEdit = () => {
    if (product?.status !== 'DELETED') {
      router.push(`/products?slug=${generateUniqueId(product)}`);
    }
  };

  const handleDelete = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_product_warning',
          defaultMessage:
            'This action will permanently delete this product and all associated data. Are you sure you want to continue?',
        })}
        onOkClick={async () => {
          setModal('');
          await removeProduct({ productId: product._id });
        }}
        okText={formatMessage({
          id: 'delete_product',
          defaultMessage: 'Delete Product',
        })}
      />,
    );
  };
  const productUrl = `/products?slug=${generateUniqueId(product)}`;
  const TypeName = (
    <span className="text-xs mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded w-fit">
      {(product.__typename || product.type || 'SimpleProduct').replace(
        'Product',
        '',
      ) || 'Simple'}
    </span>
  );
  return (
    <Table.Row className="group">
      <Table.Cell>
        {product?.status !== 'DELETED' ? (
          <Link
            href={productUrl}
            className="flex items-center text-sm text-slate-900 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-100"
          >
            {showAvatar && (
              <MediaAvatar
                file={product?.media?.length && product.media[0].file}
                className="mr-3"
              />
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {product?.texts?.title || (
                  <>
                    {product._id}{' '}
                    <Badge
                      color="yellow"
                      text={formatMessage({
                        id: 'title_not_found',
                        defaultMessage: 'Title not found',
                      })}
                    />
                  </>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center text-sm text-slate-900">
            {showAvatar && (
              <MediaAvatar
                file={product?.media?.length && product.media[0].file}
                className="mr-3"
              />
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {product?.texts?.title || (
                  <>
                    {product._id}{' '}
                    <Badge
                      color="yellow"
                      text={formatMessage({
                        id: 'title_not_found',
                        defaultMessage: 'Title not found',
                      })}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">{TypeName}</Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">
        {product?.status !== 'DELETED' ? (
          <Link href={productUrl} className="block">
            <ProductStatusBadge status={product?.status} />
          </Link>
        ) : (
          <ProductStatusBadge status={product?.status} />
        )}
      </Table.Cell>

      <Table.Cell>
        {product?.status !== 'DELETED' ? (
          <Link href={productUrl} className="block">
            <div className="flex flex-wrap gap-2">
              {product.tags?.map((t) => (
                <Badge key={t} text={t} color="slate" />
              ))}
            </div>
          </Link>
        ) : (
          <div className="flex flex-wrap gap-2">
            {product.tags?.map((t) => (
              <Badge key={t} text={t} color="slate" />
            ))}
          </div>
        )}
      </Table.Cell>

      {hideSortIndex ? null : (
        <Table.Cell>
          <input
            type="number"
            id={`${product?._id}-sequence`}
            className="text-center w-16 shadow-xs focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 focus:border-slate-900 block text-sm border-slate-300 rounded-md mr-2 font-semibold text-slate-900 dark:text-slate-300"
            defaultValue={product?.sequence}
            onBlur={updateProductSequence}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
        </Table.Cell>
      )}
      <Table.Cell className="text-right">
        <TableActionsMenu
          onEdit={product?.status !== 'DELETED' ? handleEdit : undefined}
          onDelete={
            hasRole('removeProduct') && product?.status === 'DRAFT'
              ? handleDelete
              : undefined
          }
          showEdit={product?.status !== 'DELETED'}
          showDelete={
            hasRole('removeProduct') &&
            product?.status === 'DRAFT' &&
            !product?.proxies?.length
          }
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default ProductListItem;
