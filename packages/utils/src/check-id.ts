export const checkId = (
  value: string,
  error?: { message: string; path?: string }
) => {
  if (typeof value !== 'string') {
    throw error || { message: 'Invalid id' };
  }
};
