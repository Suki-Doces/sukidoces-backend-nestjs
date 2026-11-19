export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClampedPagination {
  page: number;
  limit: number;
  skip: number;
}

/** Normalizes raw page/limit values and caps the page size so clients cannot request a whole table. */
export function clampPagination(
  rawPage: unknown,
  rawLimit: unknown,
  defaultLimit = 20,
  maxLimit = 100,
): ClampedPagination {
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(rawLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPagination(total: number, page: number, limit: number): Pagination {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
