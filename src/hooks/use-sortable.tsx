import { useState, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

interface UseSortableOptions<T extends string> {
  defaultField: T;
  defaultDirection?: SortDirection;
}

export function useSortable<T extends string>({
  defaultField,
  defaultDirection = "asc",
}: UseSortableOptions<T>) {
  const [sortField, setSortField] = useState<T>(defaultField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const handleSort = useCallback((field: T) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField]);

  const getSortIcon = useCallback(
    (field: T) => {
      if (sortField !== field) {
        return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
      }
      return sortDirection === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    },
    [sortField, sortDirection]
  );

  return {
    sortField,
    sortDirection,
    handleSort,
    getSortIcon,
    setSortField,
    setSortDirection,
  };
}
