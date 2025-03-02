export const getDuplicateSufix = (
  name: string,
  duplicates: { name: string }[],
) => {
  let counter = 1;
  const names = duplicates.map((d) => d.name.toLowerCase());
  const nameLowerCase = name.toLowerCase();

  if (!names.includes(nameLowerCase)) {
    return '';
  }

  const getCounter = () => {
    if (names.includes(`${nameLowerCase} (${counter})`)) {
      counter++;
      getCounter();
    }
  };

  getCounter();

  return ` (${counter})`;
};
