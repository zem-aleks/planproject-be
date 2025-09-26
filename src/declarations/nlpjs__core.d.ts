declare module '@nlpjs/core' {
  export type NluContainer = {
    use: (module: any) => void;
  };
  export const containerBootstrap: () => Promise<NluContainer>;
}
