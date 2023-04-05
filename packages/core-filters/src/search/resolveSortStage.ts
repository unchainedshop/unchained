import { FilterAdapterActions, SearchQuery } from '@unchainedshop/types/filters.js';
import { mongodb } from '@unchainedshop/mongodb';

const ORDER_BY_INDEX = 'default';
const DIRECTION_DESCENDING = 'DESC';
const DIRECTION_ASCENDING = 'ASC';

const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

const normalizeDirection = (textualInput) => {
  if (textualInput === DIRECTION_ASCENDING) {
    return 1;
  }
  if (textualInput === DIRECTION_DESCENDING) {
    return -1;
  }
  return null;
};

const defaultStage = ({ orderBy }: { orderBy?: string }): mongodb.FindOptions['sort'] => {
  if (!orderBy || orderBy === ORDER_BY_INDEX) {
    if (AMAZON_DOCUMENTDB_COMPAT_MODE) {
      return {
        sequence: 1,
      };
    }
    return {
      index: 1,
    };
  }

  const orderBySlices = orderBy.split('_');
  const maybeDirection = orderBySlices.pop();

  const direction = normalizeDirection(maybeDirection);
  if (direction === null) orderBySlices.push(maybeDirection);

  const keyPath = orderBySlices.join('.');

  return {
    [keyPath]: direction === null ? 1 : direction,
    [AMAZON_DOCUMENTDB_COMPAT_MODE ? 'sequence' : 'index']: 1,
  };
};

export const resolveSortStage = async (
  searchQuery: SearchQuery,
  filterActions: FilterAdapterActions,
) => {
  const stage = defaultStage(searchQuery);

  return filterActions.transformSortStage(stage);
};
