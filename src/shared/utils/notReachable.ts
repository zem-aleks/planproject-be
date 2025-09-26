export const notReachable = (_: never): never => {
  throw new Error(`Not reachable state appeared: ${_}`);
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noOperation = () => {};

export const notImplemented = (): never => {
  throw new Error(`Not implemented code path`);
};
