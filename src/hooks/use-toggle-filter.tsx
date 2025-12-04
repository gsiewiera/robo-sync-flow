import { useState, useCallback } from "react";

export function useToggleFilter<T = string>(initialValues: T[] = []) {
  const [selectedValues, setSelectedValues] = useState<T[]>(initialValues);

  const toggle = useCallback((value: T) => {
    setSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }, []);

  const clear = useCallback(() => {
    setSelectedValues([]);
  }, []);

  const set = useCallback((values: T[]) => {
    setSelectedValues(values);
  }, []);

  const has = useCallback(
    (value: T) => selectedValues.includes(value),
    [selectedValues]
  );

  const isEmpty = selectedValues.length === 0;
  const count = selectedValues.length;

  return {
    selectedValues,
    toggle,
    clear,
    set,
    has,
    isEmpty,
    count,
  };
}

// Convenience hook for multiple filter groups
export function useMultipleFilters<K extends string>() {
  const [filters, setFilters] = useState<Record<K, string[]>>({} as Record<K, string[]>);

  const toggle = useCallback((key: K, value: string) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }, []);

  const clear = useCallback((key?: K) => {
    if (key) {
      setFilters((prev) => ({ ...prev, [key]: [] }));
    } else {
      setFilters({} as Record<K, string[]>);
    }
  }, []);

  const get = useCallback(
    (key: K): string[] => filters[key] || [],
    [filters]
  );

  const has = useCallback(
    (key: K, value: string): boolean => (filters[key] || []).includes(value),
    [filters]
  );

  const hasAnyActive = useCallback(
    () => Object.values(filters).some((arr) => (arr as string[]).length > 0),
    [filters]
  );

  return {
    filters,
    toggle,
    clear,
    get,
    has,
    hasAnyActive,
    setFilters,
  };
}
