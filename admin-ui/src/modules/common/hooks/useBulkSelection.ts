import { useState, useCallback, useEffect, useMemo } from 'react';

const EMPTY_IDS: readonly string[] = [];

const useBulkSelection = <T extends string = string>(
  availableIds: readonly T[] = EMPTY_IDS as readonly T[],
) => {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());
  const availableIdSet = useMemo(() => new Set(availableIds), [availableIds]);

  useEffect(() => {
    setSelectedIds((previous) => {
      const next = new Set(
        [...previous].filter((id) => availableIdSet.has(id)),
      );
      return next.size === previous.size ? previous : next;
    });
  }, [availableIdSet]);

  const toggle = useCallback(
    (id: T) => {
      if (!availableIdSet.has(id)) return;
      setSelectedIds((previous) => {
        const next = new Set(previous);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [availableIdSet],
  );

  const selectAll = useCallback(
    (ids: readonly T[] = availableIds) => {
      setSelectedIds(new Set(ids.filter((id) => availableIdSet.has(id))));
    },
    [availableIds, availableIdSet],
  );

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const allSelected =
    availableIds.length > 0 && availableIds.every((id) => selectedIds.has(id));

  const toggleAll = useCallback(() => {
    if (
      availableIds.length > 0 &&
      availableIds.every((id) => selectedIds.has(id))
    ) {
      clearAll();
    } else {
      selectAll();
    }
  }, [availableIds, selectedIds, selectAll, clearAll]);

  return useMemo(
    () => ({
      selectedIds: Array.from(selectedIds),
      selectedCount: selectedIds.size,
      allSelected,
      toggle,
      selectAll,
      clearAll,
      isSelected,
      toggleAll,
    }),
    [
      selectedIds,
      allSelected,
      toggle,
      selectAll,
      clearAll,
      isSelected,
      toggleAll,
    ],
  );
};

export default useBulkSelection;
