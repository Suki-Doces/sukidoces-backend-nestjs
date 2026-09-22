export interface ClampedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function clampPagination(
  rawPage: unknown,
  rawLimit: unknown,
  defaultLimit = 20,
  maxLimit = 100,
): ClampedPagination {
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(rawLimit), 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
