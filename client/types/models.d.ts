/// <reference path='./go.d.ts' />
/// <reference path='./mnist.d.ts' />

// import {Tensor} from '@tensorflow/tfjs-core/dist/tensor';

declare interface TrainingsData {
  features: number[][][][];
  labels: number[][];  // sample * width * length * 1
}

declare interface Training {
  // trainingsData: TrainingsData;
  // dataProvider: DataProvider;  // TODO(): where to provide the data?
  training: {progress: {finished: number, total: number}, description: string};
}

declare interface Prediction {
  value: number;
  uncertainty: number;
}

declare namespace Model {
  type Node = Convolution|Input|Output|Flatten|MaxPool|Relu|MatMul|Add|Reshape|
      UniformVariable|NormalVariable;
  interface BaseNode {
    // type: 'convolution'|'output'|'input'
    outputs: string[];
    input?: string;
    // shape: number[];
    name: string;
    id: string;
  }

  interface Output extends BaseNode {
    type: 'output';
  }

  interface Variable extends BaseNode {
    type: 'variable';
    shape: number[];
  }

  interface NormalVariable extends Variable {
    init: 'normal';
    mean: number;
    stdDev: number;
  }

  interface UniformVariable extends Variable {
    init: 'uniform';
    min: number;
    max: number;
  }

  interface Convolution extends BaseNode {
    type: 'convolution';

    kernel: number[];
    filters: number;
    strides: number;
    depth: number;
    weights?: {kernel: number[], bias: number[]};  // Deprecated
    activation?: 'relu';                           // Deprecated
  }

  interface Relu extends BaseNode {
    type: 'relu';
  }

  interface MaxPool extends BaseNode {
    type: 'max-pool';
    filterSize: number[];
    strides: number;
    pad: number;
  }

  interface MatMul extends BaseNode {
    type: 'mat-mul';
    shape?: number[];  // Deprecated
  }

  interface Add extends BaseNode {
    type: 'add';
    shape?: number[];  // Deprecated
  }

  interface Reshape extends BaseNode {
    type: 'reshape';
    shape?: number[];
  }

  interface Input extends BaseNode {
    type: 'input';
    legend: string[];
    shape: number[];
  }

  interface Flatten extends BaseNode {
    type: 'flatten';
  }

  interface Graph {
    loadedScenario?: string;
    input?: string;
    nodes: Node[];
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
  // nextTrainBatch(batchSize: number): {xs: Tensor, labels: Tensor};
  getSample(index: number): {feature: any, label: any}
}