import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import useFormatDateTime from '../../modules/common/utils/useFormatDateTime';
import ProductDetail from '../../modules/product/components/ProductDetail';
import ProductImageGallery from '../../modules/product/components/ProductImageGallery';
import useProduct from '../../modules/product/hooks/useProduct';
import SelectOptions from '../../modules/common/components/SelectOptions';
import usePublishProduct from '../../modules/product/hooks/usePublishProduct';
import useUnPublishProduct from '../../modules/product/hooks/useUnPublishProduct';
import useUpdateProduct from '../../modules/product/hooks/useUpdateProduct';
import HeaderDeleteButton from '../../modules/common/components/HeaderDeleteButton';
import useRemoveProduct from '../../modules/product/hooks/useRemoveProduct';
import useModal from '../../modules/modal/hooks/useModal';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import CustomError from '../../modules/common/CustomError';
import { useRouter } from 'next/router';
import useAuth from '../../modules/Auth/useAuth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import { IProduct } from '../../gql/types';
import AlertMessage from '../../modules/modal/components/AlertMessage';

const ProductDetailPage = ({ slug }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { hasRole } = useAuth();
  const { publishProduct } = usePublishProduct();
  const { unPublishProduct } = useUnPublishProduct();
  const { removeProduct } = useRemoveProduct();
  const { updateProduct } = useUpdateProduct();
  const { setModal } = useModal();
  const router = useRouter();
  const { push } = useRouter();

  const { product, loading, error, extendedData } = useProduct({
    slug,
  });
  const status = product?.status || 'DRAFT';
  const activeOptions = useMemo(
    () => [
      {
        id: 'published',
        title: formatMessage({
          id: 'published',
          defaultMessage: 'Published',
        }),
        description: formatMessage({
          id: 'publish_product_description',
          defaultMessage:
            'Product will be searchable and is available for orders',
        }),
        current: status === 'ACTIVE',
        selectedTitle: formatMessage({
          id: 'published',
          defaultMessage: 'Published',
        }),
        onClick: async () => {
          try {
            await publishProduct({ productId: product?._id });
            toast.success(
              formatMessage({
                id: 'product_published',
                defaultMessage: 'Published successfully ',
              }),
            );
          } catch (error: any) {
            console.error('Failed to publish product:', error);
            const errorMessage = error?.message || 'Unknown error';
            toast.error(
              `${formatMessage({
                id: 'product_publish_error',
                defaultMessage: 'Failed to publish product',
              })}: ${errorMessage}`,
            );
          }
        },
        bgColor: 'green',
        disable: !hasRole('publishProduct'),
      },
      {
        id: 'draft',
        title: formatMessage({
          id: 'draft',
          defaultMessage: 'Draft',
        }),
        description: formatMessage({
          id: 'draft_product_description',
          defaultMessage:
            'Product will not be discoverable and can not be orderose',
        }),
        current: status === 'DRAFT',
        selectedTitle: formatMessage({
          id: 'not_published',
          defaultMessage: 'Not published',
        }),
        bgColor: 'amber',
        disable: status === 'ACTIVE' && !hasRole('unpublishProduct'),
        onClick: async () => {
          if (hasRole('unpublishProduct') || hasRole('publishProduct')) {
            try {
              await unPublishProduct({ productId: product?._id });
              toast.success(
                formatMessage({
                  id: 'product_drafted',
                  defaultMessage: 'Drafted successfully ',
                }),
              );
            } catch (error: any) {
              console.error('Failed to unpublish product:', error);
              const errorMessage = error?.message || 'Unknown error';
              toast.error(
                `${formatMessage({
                  id: 'product_unpublish_error',
                  defaultMessage: 'Failed to unpublish product',
                })}: ${errorMessage}`,
              );
            }
          }
        },
      },
    ],
    [product],
  );

  if (error) {
    console.error('Error loading product:', error);
    return (
      <div className="mt-5 max-w-full">
        <div className="text-center py-8">
          <p className="text-rose-600 dark:text-rose-400">
            {formatMessage({
              id: 'product_load_error',
              defaultMessage: 'Failed to load product',
            })}
          </p>
        </div>
      </div>
    );
  }

  const updateProductSequence = async (e) => {
    if (e.target.value)
      await updateProduct({
        productId: product?._id,
        product: {
          sequence: parseInt(e.target.value, 10),
        },
      });
  };

  const handleDeleteProduct = async () => {
    if ('proxies' in product && product.proxies?.length) {
      await setModal(
        <AlertMessage
          headerText={formatMessage({
            id: 'product_delete_blocked_header',
            defaultMessage: 'Remove links before deleting',
          })}
          message={
            <div className="space-y-2">
              <p>
                {formatMessage({
                  id: 'product_delete_blocked_intro',
                  defaultMessage:
                    'This product is linked to the following product types:',
                })}
              </p>
              <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                {'proxies' in product &&
                  product.proxies.map(({ __typename }, idx) => (
                    <li key={idx}>{__typename.replace('Product', '')}</li>
                  ))}
              </ul>
              <p>
                {formatMessage({
                  id: 'product_delete_blocked_action',
                  defaultMessage:
                    'Please unlink it before trying to delete it.',
                })}
              </p>
            </div>
          }
          buttonText={formatMessage({ id: 'ok', defaultMessage: 'Ok' })}
          onOkClick={() => setModal(null)}
        />,
      );
      return;
    }

    await setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={formatMessage({
          id: 'delete_product_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it and it is nonreversible. Are you sure you want to delete this product?',
        })}
        onOkClick={async () => {
          setModal('');
          try {
            await removeProduct({ productId: product?._id });
            toast.success(
              formatMessage({
                id: 'product_deleted_success',
                defaultMessage: 'Deleted successfully',
              }),
            );
            router.push('/products');
          } catch (e: any) {
            await setModal(
              <DangerMessage
                onCancelClick={() => setModal('')}
                headerText={formatMessage({
                  id: 'error',
                  defaultMessage: 'Error',
                })}
                message={e instanceof CustomError ? e.message : e}
                icon={
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <XMarkIcon
                      className="h-6 w-6 text-rose-600 dark:text-rose-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </div>
                }
                okText={formatMessage({ id: 'ok', defaultMessage: 'Ok' })}
                onOkClick={async () => {
                  setModal('');
                }}
              />,
            );
          }
        }}
      />,
    );
  };

  if (!product && !loading) {
    push('/404');
    return null;
  }

  if (loading) return <Loading />;

  return (
    <div className="mt-5 max-w-full">
      <BreadCrumbs
        routeName={slug}
        depth={3}
        currentPageTitle={product?.texts?.title}
      />
      {status === 'DELETED' && (
        <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          {formatMessage({
            id: 'product_deleted_notice',
            defaultMessage:
              'This product has been deleted and is no longer active. Some actions may be restricted.',
          })}
        </div>
      )}
      <div>
        <div className="items-center flex-wrap flex gap-5 min-w-full justify-between">
          <PageHeader
            headerText={
              <>
                {product?.texts?.title || 'Untitled Product'}
                {status === 'DELETED' && (
                  <span className="ml-3 rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                    {formatMessage({
                      id: 'deleted_status',
                      defaultMessage: 'Deleted',
                    })}
                  </span>
                )}
              </>
            }
            title={`${product?.texts?.title || 'Product'} (${product?._id})`}
          />
          <div className="publish-and-order flex flex-wrap gap-3">
            {status && status !== 'DELETED' && (
              <SelectOptions
                options={activeOptions}
                type={formatMessage({
                  id: 'product',
                  defaultMessage: 'Product',
                })}
              />
            )}
            <div className="inline-flex items-center gap-2 rounded-md dark:border-slate-600 px-4 py-2 text-sm font-medium leading-5 shadow-xs bg-white dark:bg-slate-800 h-[38px]">
              <label
                htmlFor="sequence-input"
                className="text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
              >
                {formatMessage({
                  id: 'sequence',
                  defaultMessage: 'Display Order',
                })}
              </label>
              <input
                type="number"
                id="sequence-input"
                disabled={!hasRole('manageProducts')}
                className="text-center w-12 bg-transparent border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:border-transparent focus:outline-none text-sm font-semibold text-slate-900 dark:text-slate-300 px-2 py-1 transition-all"
                defaultValue={product?.sequence}
                onBlur={updateProductSequence}
              />
            </div>
            {status === 'DRAFT' && hasRole('removeProduct') && (
              <HeaderDeleteButton onClick={handleDeleteProduct} />
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 gap-x-10 text-slate-600 dark:text-slate-400">
          <div className="flex flex-col items-baseline gap-0">
            <span className="mr-2 text-xs text-slate-500 dark:text-slate-500">
              ID:
            </span>
            <span className="text-sm font-mono">{product?._id}</span>
          </div>
          <div className="flex flex-col items-baseline gap-0">
            <span className="text-xs text-slate-500 dark:text-slate-500">
              Type:
            </span>
            <p className="text-sm font-mono">{product?.['__typename']}</p>
          </div>
          {product?.created && (
            <div className="flex flex-col items-baseline gap-0">
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {formatMessage({ id: 'created', defaultMessage: 'Created' })}:
              </span>
              <span className="text-sm font-mono">
                {formatDateTime(product.created, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
          {product?.updated && (
            <div className="flex flex-col items-baseline gap-0">
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {formatMessage({ id: 'updated', defaultMessage: 'Updated' })}:
              </span>
              <span className="text-sm font-mono">
                {formatDateTime(product.updated, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
          {product?.published && (
            <div className="flex flex-col items-baseline gap-0">
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {formatMessage({
                  id: 'published',
                  defaultMessage: 'Published',
                })}
                :
              </span>
              <span className="text-sm font-mono">
                {formatDateTime(product.published, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <ProductImageGallery
        productId={product?._id}
        media={product?.media || ([] as any)}
        onEditMedia={(mediaId) => {
          // Navigate to media tab
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, tab: 'media' },
            },
            undefined,
            {
              shallow: true,
            },
          );
        }}
        canEdit={hasRole('editProduct')}
      />

      <ProductDetail
        product={product as IProduct & { __typename: string }}
        extendedData={extendedData}
      />
    </div>
  );
};

export default ProductDetailPage;
