import { Pagination } from 'src/types/pagination.types';

export const getPagination = (page: number) => {
  const limit = 10;
  const skip = (page - 1) * limit;
  return { limit, skip };
};
