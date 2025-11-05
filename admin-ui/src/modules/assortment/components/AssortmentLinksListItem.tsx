import { useSortable } from '@dnd-kit/sortable';
import { IRoleAction } from '../../../gql/types';

import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/router';
import Badge from '../../common/components/Badge';
import DraggableIcon from '../../common/components/DraggableIcon';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import generateUniqueId from '../../common/utils/getUniqueId';
import useAuth from '../../Auth/useAuth';

const AssortmentLinksListItem = ({ link, onDelete, linkId, isParent, id }) => {
  const { hasRole } = useAuth();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const router = useRouter();

  const handleEdit = () => {
    router.push(`/assortments?assortmentSlug=${generateUniqueId(link)}`);
  };

  const handleDelete = () => {
    onDelete(linkId);
  };
  return (
    <div
      className="group flex items-center justify-between rounded-sm border-b border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 ease-in-out hover:shadow-sm px-2 text-slate-900 dark:text-slate-200 last:border-none hover:cursor-pointer"
      ref={setNodeRef}
      style={style}
    >
      <div className="flex flex-col justify-center space-x-6 py-4 flex-auto">
        <div className="flex gap-5 items-center">
          <div className="flex items-center">
            <Badge color="cyan" text={isParent ? 'Parent' : 'Descendant'} />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-wrap gap-5">
              <h3 className="text-lg flex-auto">{link?.texts?.title}</h3>
              {link?.texts?.title && (
                <p className="flex-auto text-xs text-slate-600 dark:text-slate-400 my-auto">
                  {link?.texts?.subtitle}
                </p>
              )}
            </div>
            {link?.tags && (
              <div className="flex gap-2">
                {link?.tags.map((tag, key) => (
                  <Badge
                    key={`${tag}${key + 1}`}
                    text={tag}
                    color="blue"
                    className="px-3 text-sm font-light capitalize py-0"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center gap-5">
          {hasRole(IRoleAction.ManageAssortments) && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="hover:cursor-move"
            >
              <DraggableIcon />
            </button>
          )}
          <TableActionsMenu
            onEdit={handleEdit}
            onDelete={handleDelete}
            showEdit={true}
            showDelete={hasRole(IRoleAction.ManageAssortments)}
          />
        </div>
      </div>
    </div>
  );
};

export default AssortmentLinksListItem;
