import { useIntl } from 'react-intl';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useRouter } from 'next/router';
import Badge from '../../common/components/Badge';
import DraggableIcon from '../../common/components/DraggableIcon';
import TableActionsMenu from '../../common/components/TableActionsMenu';

const AssortmentFiltersListItem = ({ link, onDelete, id }) => {
  const { formatMessage } = useIntl();

  const { _id, filter, tags } = link;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/filters?filterId=${filter._id}`);
  };

  const handleDelete = () => {
    onDelete(_id);
  };

  return (
    <div
      onClick={() => {
        router.push(`/filters?filterId=${filter._id}`);
      }}
      ref={setNodeRef}
      style={style}
      className="group flex items-center justify-between rounded-sm border-b border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 ease-in-out hover:shadow-sm px-2 gap-4 last:border-none hover:cursor-pointer"
    >
      <div className="shrink-0 grow-0 basis-20 pl-5 space-y-1 p-2">
        <Badge
          color={filter?.isActive ? 'emerald' : 'slate'}
          text={
            filter?.isActive
              ? formatMessage({ id: 'active', defaultMessage: 'Active' })
              : formatMessage({
                  id: 'inactive',
                  defaultMessage: 'In-Active',
                })
          }
        />
      </div>
      <div className="shrink grow basis-1/3 pl-5 space-y-1 p-2">
        <h3 className="text-lg text-slate-800 dark:text-slate-200">
          ({filter?.key}) {filter?.texts?.title}
        </h3>
        <p className="text-xs text-slate-600">{filter?.texts?.subtitle}</p>
        <Badge color="slate" text={filter?.type} />
      </div>
      <div className="basis-1/4 pl-5 space-y-1 p-2">
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <Badge color="slate" text={tag} key={tag} />
          ))}
        </div>
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

export default AssortmentFiltersListItem;
