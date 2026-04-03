export const logInfo = (
  message: string,
  context: Record<string, unknown>,
): void => {
  console.log(
    JSON.stringify({
      level: 'info',
      message,
      ...context,
    }),
  );
};

export const logError = (
  message: string,
  context: Record<string, unknown>,
): void => {
  console.error(
    JSON.stringify({
      level: 'error',
      message,
      ...context,
    }),
  );
};
