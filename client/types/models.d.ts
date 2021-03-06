/// <reference path='./go.d.ts' />
/// <reference path='./mnist.d.ts' />

declare interface Vector2 {
  x: number;
  y: number;
}

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

  activations: Map<string, Model.ActivationInfo>;
}

declare namespace Model {
  type Node =
      Convolution|Input|Output|Flatten|MaxPool|Relu|MatMul|Add|Reshape|Variable;

  type ValidationState = {state: 'invalid', reason: string}|{state: 'valid'};

  interface ConnectionConstraints {
    shape: (number|undefined)[];  // Undefined means that there is no constraint
                                  // for that rank
    valid: ValidationState;
  }

  // TODO: Add a dict of connection information
  interface ConnectionsInfo {
    inputs: Map<string, ConnectionConstraints>;
    outputs: Map<string, ConnectionConstraints>;
    removeInputs?: string[];
    removeOutputs?: string[];
  }

  interface Property<T> {
    name: string;
    value: T;
    type: 'string'|'number'|'number[]';
    readonly: boolean;
  }

  interface NodeContainer<T = Model.Node> {
    // TODO(#1): dont store the raw node but the unrolled property information
    // Property
    node: T;
    position: Vector2;
    valid: boolean;

    connections?: ConnectionsInfo;
  }

  interface BaseNode {
    outputs: string[];
    name: string;
    id: string;
  }

  interface ActivationInfo {
    shape: number[];
    values: number[];
  }

  interface OperationNode extends BaseNode {
    // TODO: Use Map<string,string> instead
    inputs: {[key: string]: string};
    activations?: ActivationInfo;
  }

  interface Output extends OperationNode {
    type: 'output';
    inputs: {'input': string};
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
    content?: number[];
  }

  interface UniformVariable extends VariableBase {
    init: 'uniform';
    min: number;
    max: number;
    content?: number[];
  }

  interface ZeroVariable extends VariableBase {
    init: 'zero';
    content?: number[];
  }

  interface Convolution extends OperationNode {
    type: 'convolution';
    filters: number;  // Given by weight variable
    strides: number;
    padding: 'valid'|'same';
    rank: number;  // Convolution1 or Convolution2, ... ?
    inputs: {'orig': string, 'kernel': string};
    weights?: {kernel: number[], bias: number[]};  // Deprecated
    activation?: 'relu';                           // Deprecated
  }

  interface Relu extends OperationNode {
    type: 'relu';
    inputs: {'orig': string}
  }

  interface MaxPool extends OperationNode {
    type: 'max-pool';
    filterSize: number|[number, number];
    strides: number;
    pad: number;
    inputs: {'orig': string}
  }

  interface MatMul extends OperationNode {
    type: 'mat-mul';
    inputs: {'multiplicand': string, 'multiplier': string}
  }

  interface Add extends OperationNode {
    type: 'add';
    inputs: {'first-addend': string, 'second-addend': string}
  }

  interface Reshape extends OperationNode {
    type: 'reshape';
    shape?: number[];
    inputs: {'orig': string},
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
    isValid: boolean;
    // input?: string;  // Or should that be always the same -> convention?
    // output?: string;  // Or should that be always the same -> convention?
    nodes: NodeContainer[];
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