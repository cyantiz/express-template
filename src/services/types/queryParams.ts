export interface IQueryParams {
  page: number;
  limit: number;
  searchKey: string;
  sortField: string;
  sortType: 'asc' | 'desc';
}
