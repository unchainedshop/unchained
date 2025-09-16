import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/router';

import Badge from '../../common/components/Badge';
import DraggableIcon from '../../common/components/DraggableIcon';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import generateUniqueId from '../../common/utils/getUniqueId';

const AssortmentProductListItem = ({ link, onDelete, id }) => {
  const { _id, product, tags } = link;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const router = useRouter();

  const handleEdit = () => {
    router.push(`/products?slug=${generateUniqueId(link?.product)}`);
  };

  const handleDelete = () => {
    onDelete(_id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center justify-between rounded-sm border-b border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 ease-in-out hover:shadow-sm px-2 text-slate-900 dark:text-slate-200 last:border-none hover:cursor-pointer"
      onClick={() => {
        router.push(`/products?slug=${generateUniqueId(link?.product)}`);
      }}
    >
      <div className="flex items-center py-4">
        <div>
          <h3 className="text-lg text-slate-800 dark:text-slate-200">
            {product?.texts?.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-200">
            {product?.texts?.subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(tags || [])?.map((tag) => (
          <Badge text={tag} color="cyan" key={tag} />
        ))}
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="hover:cursor-move"
          >
            <DraggableIcon />
          </button>
          <TableActionsMenu
            onEdit={handleEdit}
            onDelete={handleDelete}
            showEdit={true}
            showDelete={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AssortmentProductListItem;
