import { useState, useCallback, useMemo } from "react";

interface UsePaginationOptions {
  defaultPageSize?: number;
  defaultPage?: number;
}

export function usePagination<T>({
  defaultPageSize = 20,
  defaultPage = 1,
}: UsePaginationOptions = {}) {
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const getPaginatedData = useCallback(
    (data: T[]) => {
      const indexOfLastRecord = currentPage * pageSize;
      const indexOfFirstRecord = indexOfLastRecord - pageSize;
      return data.slice(indexOfFirstRecord, indexOfLastRecord);
    },
    [currentPage, pageSize]
  );

  const getTotalPages = useCallback(
    (totalItems: number) => Math.ceil(totalItems / pageSize),
    [pageSize]
  );

  return {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
    getPaginatedData,
    getTotalPages,
  };
}
