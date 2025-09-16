import { useIntl } from 'react-intl';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import NoData from '../../common/components/NoData';
import AssortmentLinksListItem from './AssortmentLinksListItem';
import { IAssortmentLink } from '../../../gql/types';

const AssortmentLinksList = ({
  currentAssortmentId,
  links,
  onRemoveLink,
  items,
}) => {
  const { formatMessage } = useIntl();
  return links.length ? (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div className="space-y-4 py-3 px-6 rounded-sm transition-[background-color] ease-in-out delay-200">
        {items.map((id) => {
          const { child, parent, _id } = Object.values(
            links as IAssortmentLink[],
          ).find((link) => link._id === id);
          const comp = [];
          if (parent && parent._id !== currentAssortmentId) {
            comp.push(
              <AssortmentLinksListItem
                id={id}
                key={parent._id}
                link={parent}
                isParent={parent?.childrenCount}
                linkId={_id}
                onDelete={onRemoveLink}
              />,
            );
          }
          if (child && child._id !== currentAssortmentId) {
            comp.push(
              <AssortmentLinksListItem
                id={id}
                key={child._id}
                link={child}
                linkId={_id}
                isParent={child._id === currentAssortmentId}
                onDelete={onRemoveLink}
              />,
            );
          }

          return comp;
        })}
      </div>
    </SortableContext>
  ) : (
    <NoData
      message={formatMessage({
        id: 'linked_assortment',
        defaultMessage: 'Linked assortment',
      })}
    />
  );
};

export default AssortmentLinksList;
