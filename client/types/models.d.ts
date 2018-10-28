/// <reference path='./go.d.ts' />
/// <reference path='./mnist.d.ts' />

// import {Tensor} from '@tensorflow/tfjs-core/dist/tensor';

declare interface TrainingsData {
  features: number[][][][];
  labels: number[][];  // sample * width * length * 1
}

declare interface Training {
  trainingsData: TrainingsData;
  // dataProvider: DataProvider;  // TODO(): where to provide the data?
  training: {progress: {finished: number, total: number}, description: string};
}

declare interface Prediction {
  value: number;
  uncertainty: number;
}

declare namespace Model {
  type Node = Convolution|Input|Output|Flatten;
  interface BaseNode {
    // type: 'convolution'|'output'|'input'
    outputs: Node[];
    input?: Node;
    shape: number[];
    name: string;
    id: string;
  }

  interface Output extends BaseNode {
    type: 'output';
  }

  interface Convolution extends BaseNode {
    type: 'convolution';

    kernel: {size: number};
    filters: number;
    strides: number;
    weights: {kernel: number[], bias: number[]};
    activation: 'relu';
    outputs: Node[];
  }

  interface Input extends BaseNode {
    type: 'input';
    legend: string[];
  }

  interface Flatten extends BaseNode {
    type: 'flatten';
  }

  interface Graph {
    input?: Input;
  }
}

declare interface RootState {
  go: Go;
  mnist: MnistState;
  graph: Model.Graph;

  training: Training;
}

declare interface DataProvider {
  load(): Promise<void>;
  nextTrainBatch(batchSize: number): {xs: any, labels: any};
  getSample(index: number): {feature: any, label: any}
  // nextTrainBatch(batchSize: number): {xs: Tensor, labels: Tensor};
}