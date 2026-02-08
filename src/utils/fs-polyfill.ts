// Polyfill for fs/promises in browser environment
export const readFile = () => {
  throw new Error('fs/promises is not available in browser environment');
};

export const writeFile = () => {
  throw new Error('fs/promises is not available in browser environment');
};

export default {
  readFile,
  writeFile,
};
