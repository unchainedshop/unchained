const wait = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const intervalUntilTimeout = async (
  fnToCheckResult,
  timeout,
  stepCount = 10,
) => {
  const interval = timeout / stepCount;
  return new Promise((resolve) => {
    const intervalHandle = setInterval(async () => {
      try {
        const maybeTrueish = await fnToCheckResult();
        if (maybeTrueish) {
          clearInterval(intervalHandle);
          resolve(maybeTrueish);
        }
        // eslint-disable-next-line
      } catch {}
    }, interval);
    setTimeout(() => {
      clearInterval(intervalHandle);
      resolve(false);
    }, timeout);
  });
};

export default wait;
