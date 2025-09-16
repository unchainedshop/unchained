import Badge from '../../common/components/Badge';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import NoImage from '../../common/components/NoImage';
import TableActionsMenu from '../../common/components/TableActionsMenu';

const BundleProductsListItem = ({ item, onDelete, index }) => {
  const { product, quantity } = item;

  const handleDelete = () => {
    onDelete(index);
  };

  return (
    <div className="group flex w-full items-center justify-between border-b border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 ease-in-out hover:shadow-sm last:border-none">
      <div className="flex w-full items-center space-x-6 py-4">
        {product.media?.length ? (
          <div className="flex w-20 flex-col items-center">
            <div className="relative m-1 mr-2 mt-1 flex items-center  justify-center rounded-full ">
              <ImageWithFallback
                className="mx-auto w-auto"
                src={product.media[0]?.file?.url}
                width={160}
                height={100}
                alt={product?.texts?.title || product?.texts?.subtitle}
              />
            </div>
          </div>
        ) : (
          <NoImage className="h-10 w-10" />
        )}

        <div className="shrink grow basis-1/2">
          <h3 className="text-lg text-slate-800 dark:text-slate-200">
            {product?.texts?.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-200">
            {product?.texts?.subtitle}
          </p>
        </div>

        <div className="ml-auto">
          <Badge text={quantity} color="slate" square />
        </div>
      </div>

      <TableActionsMenu onDelete={handleDelete} showDelete={true} />
    </div>
  );
};

export default BundleProductsListItem;
