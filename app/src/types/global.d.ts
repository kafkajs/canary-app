export {};

declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}
