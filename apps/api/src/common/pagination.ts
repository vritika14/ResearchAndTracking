export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number,
): PaginatedResult<never>['meta'] {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return { page: safePage, pageSize, totalItems, totalPages };
}
export function paginationOffset(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * pageSize;
}
