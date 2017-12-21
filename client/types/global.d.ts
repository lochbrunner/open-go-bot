/**
 * Global definitions for developement
 */

// for style loader
declare module '*.css' {
  const styles: any;
  export = styles;
}

declare module '*.scss' {
  const styles: any;
  export = styles;
}

// for redux devtools extension
declare interface Window {
  devToolsExtension?(): (args?: any) => any;
  __REDUX_DEVTOOLS_EXTENSION__?(): (args?: any) => any;
}
