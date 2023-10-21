export const getPagination = (
  pageQuery: string,
  limitQuery: string,
  offsetQuery?: string,
): {limit: number; offset: number; page: number} => {
  let limit = parseInt(limitQuery);
  let offset = parseInt(offsetQuery);
  let page = parseInt(pageQuery);

  if (isNaN(limit) || limit === 0) limit = 5;
  if ((isNaN(page) || page === 0) && isNaN(offset)) {
    offset = 0;
    page = 1;
  } else if (isNaN(offset)) {
    offset = limit * (page - 1);
  } else {
    page = Math.trunc(offset / limit) + 1;
  }

  return {
    limit,
    offset,
    page,
  };
};

export type Pagination = {
  limit: number;
  page: number;
  offset?: number;
};
