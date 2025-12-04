import { useState, useEffect, useCallback } from "react";
import { ColumnConfig } from "@/components/ui/column-visibility-toggle";

interface UseColumnVisibilityOptions {
  columns: ColumnConfig[];
  storageKey?: string;
}

export function useColumnVisibility({
  columns,
  storageKey,
}: UseColumnVisibilityOptions) {
  const getDefaultVisible = useCallback(
    () => columns.filter((c) => c.defaultVisible !== false).map((c) => c.key),
    [columns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return getDefaultVisible();
        }
      }
    }
    return getDefaultVisible();
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, storageKey]);

  const toggleColumn = useCallback((columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  }, []);

  const isColumnVisible = useCallback(
    (key: string) => visibleColumns.includes(key),
    [visibleColumns]
  );

  const resetToDefault = useCallback(() => {
    setVisibleColumns(getDefaultVisible());
  }, [getDefaultVisible]);

  return {
    visibleColumns,
    toggleColumn,
    isColumnVisible,
    resetToDefault,
  };
}
