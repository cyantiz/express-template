export function sortOrder(sortRequest: SortRequest): SortRequest {
  let sort = null;

  switch (sortRequest.sortOrder) {
    case SortOrder.Ascending:
      sort = {[`${sortRequest.sortField}`]: 1};
      break;
    case SortOrder.Descending:
      sort = {[`${sortRequest.sortField}`]: -1};
      break;
  }

  return sort;
}

export type SortRequest = {
  sortField: string;
  sortOrder: SortOrder;
};

export enum SortOrder {
  Ascending = 'Ascending',
  Descending = 'Descending',
}
