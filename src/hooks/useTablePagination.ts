import { useEffect, useMemo, useState } from 'react';
import {
  getPageSlice,
  getTotalPages,
  TABLE_PAGE_SIZE,
} from '@/lib/tablePagination';

export function useTablePagination<T>(items: T[], pageSize: number = TABLE_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = getTotalPages(items.length, pageSize);
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(
    () => getPageSlice(items, safePage, pageSize),
    [items, safePage, pageSize],
  );

  const startIndex = (safePage - 1) * pageSize;

  return {
    page: safePage,
    setPage,
    totalPages,
    paginatedItems,
    pageSize,
    totalItems: items.length,
    startIndex,
  };
}
