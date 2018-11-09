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
  type Node =
      Convolution|Input|Output|Flatten|MaxPool|Relu|MatMul|Add|Reshape|Variable;
  interface BaseNode {
    outputs: string[];
    name: string;
    id: string;
  }

  interface OperationNode extends BaseNode {
    inputs: string[];
  }

  interface Output extends OperationNode {
    type: 'output';
  }

  interface VariableBase extends BaseNode {
    type: 'variable';
    shape?: number[];
  }

  type Variable = UniformVariable|NormalVariable|ZeroVariable;

  interface NormalVariable extends VariableBase {
    init: 'normal';
    mean: number;
    stdDev: number;
  }

  interface UniformVariable extends VariableBase {
    init: 'uniform';
    min: number;
    max: number;
  }

  interface ZeroVariable extends VariableBase {
    init: 'zero';
  }

  interface Convolution extends OperationNode {
    type: 'convolution';
    filters: number;
    strides: number;
    depth: number;
    weights?: {kernel: number[], bias: number[]};  // Deprecated
    activation?: 'relu';                           // Deprecated
  }

  interface Relu extends OperationNode {
    type: 'relu';
  }

  interface MaxPool extends OperationNode {
    type: 'max-pool';
    filterSize: number[];
    strides: number;
    pad: number;
  }

  interface MatMul extends OperationNode {
    type: 'mat-mul';
  }

  interface Add extends OperationNode {
    type: 'add';
  }

  interface Reshape extends OperationNode {
    type: 'reshape';
    shape?: number[];
  }

  interface Input extends BaseNode {
    type: 'input';
    legend: string[];
    shape: number[];
  }

  interface Flatten extends OperationNode {
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