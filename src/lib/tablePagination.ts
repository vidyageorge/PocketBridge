export const TABLE_PAGE_SIZE = 10;

export function getTotalPages(itemCount: number, pageSize: number = TABLE_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(itemCount / pageSize) || 1);
}

export function getPageSlice<T>(items: T[], page: number, pageSize: number = TABLE_PAGE_SIZE): T[] {
  const totalPages = getTotalPages(items.length, pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

export function getDisplaySerialNumber(
  rowIndexOnPage: number,
  page: number,
  pageSize: number = TABLE_PAGE_SIZE,
): number {
  return (page - 1) * pageSize + rowIndexOnPage + 1;
}
