declare interface MnistState {
  currentInput: {pixels: number[][]};
  caret: number;
  hasLoaded: boolean;
}