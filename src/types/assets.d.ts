/**
 * Deklarasi module asset statis untuk Metro + TypeScript.
 *
 * Tanpa file ini, `import x from './icon.png'` gagal TS2307
 * (Expo base types tidak declare `*.png` / `*.jpg` / dll.).
 * Runtime: Metro resolve ke asset registry id (number di native).
 */
declare module '*.png' {
  const source: number;
  export default source;
}

declare module '*.jpg' {
  const source: number;
  export default source;
}

declare module '*.jpeg' {
  const source: number;
  export default source;
}

declare module '*.webp' {
  const source: number;
  export default source;
}

declare module '*.gif' {
  const source: number;
  export default source;
}
