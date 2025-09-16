export const matrixGenerator = (columns, rowContainer, currentIndex) => {
  const column = columns[currentIndex];
  const newRows = [];
  column?.values
    .filter((v) => v.length)
    .forEach((value) => {
      const tempRow = {};
      tempRow[column.key] = value;
      if (rowContainer.length > 0) {
        rowContainer.forEach((oldRow) => {
          newRows.push({ ...oldRow, ...tempRow });
        });
      } else {
        newRows.push(tempRow);
      }
    });

  if (columns.length > currentIndex + 1) {
    return matrixGenerator(columns, newRows, currentIndex + 1);
  }
  return Array.from(new Set(newRows.map((r) => JSON.stringify(r)))).map((r) =>
    JSON.parse(r),
  );
};
export const normalizeProduct = ({ _id, texts }: any) => ({
  value: _id,
  label: texts?.title,
});
export const getRowVector = (optionValue, index, columnKeys) => ({
  key: columnKeys[index],
  value: optionValue,
});
