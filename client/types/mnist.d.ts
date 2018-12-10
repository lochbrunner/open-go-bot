declare interface MnistState {
  currentInput: {pixels: number[][]};
  caret: number;
  hasLoaded: boolean;
  groundTruth: string;
  prediction?: Prediction;
  autoPredict: boolean;

  // dataProvider: DataProvider;
}