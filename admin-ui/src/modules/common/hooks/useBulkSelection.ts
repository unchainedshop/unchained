import { useState, useCallback, useMemo } from 'react';

const useBulkSelection = <T extends string = string>() => {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const toggleAll = useCallback(
    (ids: T[]) => {
      if (selectedIds.size === ids.length) {
        clearAll();
      } else {
        selectAll(ids);
      }
    },
    [selectedIds.size, selectAll, clearAll],
  );

  return useMemo(
    () => ({
      selectedIds: Array.from(selectedIds),
      selectedCount: selectedIds.size,
      toggle,
      selectAll,
      clearAll,
      isSelected,
      toggleAll,
    }),
    [selectedIds, toggle, selectAll, clearAll, isSelected, toggleAll],
  );
};

export default useBulkSelection;
