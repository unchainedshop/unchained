export const checkId = (
  value: string,
  error?:
    | {
        message: string;
        path?: string | undefined;
      }
    | undefined,
): void => {
  if (typeof value !== 'string') {
    throw error || { message: 'Invalid id' };
  }
};
