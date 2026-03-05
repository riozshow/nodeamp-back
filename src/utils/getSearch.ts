export const getSearch = (search?: string) => {
  if (!search) return {};
  return {
    name: { contains: search },
  };
};
