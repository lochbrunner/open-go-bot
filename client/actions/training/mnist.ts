import * as tf from '@tensorflow/tfjs';
import {Tensor} from '@tensorflow/tfjs';
import * as _ from 'lodash';

import {WeightUpdateInfo} from '../../utilities/progress';

// Hyper-parameters.
const LEARNING_RATE = .1;
const BATCH_SIZE = 64;
const TRAIN_STEPS = 100;

const optimizer = tf.train.sgd(LEARNING_RATE);

// Loss function
function loss(labels, ys) {
  return tf.losses.softmaxCrossEntropy(labels, ys).mean();
}

function createDict(graph: Model.Graph): Map<string, Model.Node> {
  const dict = new Map<string, Model.Node>();
  graph.nodes.forEach(c => dict.set(c.node.id, c.node));
  return dict;
}

const cache = new Map<string, tf.Variable>();
let lastHash = '';

const getVariable = (id: string, factory: () => tf.Tensor): tf.Variable => {
  if (cache.has(id)) return cache.get(id);
  const variable = tf.variable(factory());
  cache.set(id, variable);
  return variable;
};

const hashModel = (graph: Model.Graph): string => {
  let hash = '';
  for (let c of graph.nodes) {
    const {node} = c;
    hash += _.values(_.omit(node, ['content'])).map(k => k.toString()).join();
  }

  return hash;
};

const generateModel = (graph: Model.Graph, nodeOfInterest?: string) => {
  const hash = hashModel(graph);
  if (hash !== lastHash) {
    console.log('Clearing cache');
    lastHash = hash;
    cache.forEach(v => v.dispose());
    cache.clear();
  }
  // console.log(`hash: ${hash}`);
  const dict = createDict(graph);

  const input = graph.nodes.find(c => c.node.type === 'input').node;

  const variables =
      graph.nodes.filter(c => c.node.type === 'variable')
          .map(c => c.node)
          .map(node => {
            const v = node as Model.Variable;
            const {shape} = v;
            if (v.init === 'normal') {
              const {mean, stdDev} = v;
              return getVariable(
                  v.id, () => tf.randomNormal(shape, mean, stdDev));
            } else if (v.init === 'uniform') {
              const {min, max} = v;
              return getVariable(v.id, () => tf.randomUniform(shape, min, max));
            } else if (v.init === 'zero') {
              return getVariable(v.id, () => tf.zeros(shape));
            }
          });

  // Create Model
  // TODO: Traverse from output to input
  const model = (inputXs: Tensor) => {
    let node: Model.Node = input;
    let prevTensor: tf.Tensor<any>;
    while (node.type !== 'output') {
      if (node.type === 'input') {
        if (node.shape.length === 3) {
          prevTensor =
              inputXs.as4D(-1, node.shape[0], node.shape[1], node.shape[2]);
        } else if (node.shape.length === 2) {
          prevTensor = inputXs.as3D(-1, node.shape[0], node.shape[1]);
        } else if (node.shape.length === 1) {
          prevTensor = inputXs.as2D(-1, node.shape[0]);
        }
      } else if (node.type === 'convolution') {
        const variable = cache.get(node.inputs['kernel']);
        prevTensor =
            prevTensor.conv2d(variable as any, node.strides, node.padding);
      } else if (node.type === 'relu') {
        prevTensor = prevTensor.relu();
      } else if (node.type === 'max-pool') {
        prevTensor =
            prevTensor.maxPool(node.filterSize, node.strides, node.pad);
      } else if (node.type === 'reshape') {
        if (node.shape.length === 1) {
          prevTensor = prevTensor.as2D(-1, node.shape[0]);
        } else if (node.shape.length === 2) {
          prevTensor = prevTensor.as3D(-1, node.shape[0], node.shape[1]);
        } else if (node.shape.length === 3) {
          prevTensor =
              prevTensor.as4D(-1, node.shape[0], node.shape[1], node.shape[2]);
        }
      } else if (node.type === 'mat-mul') {
        const variable = cache.get(node.inputs['multiplier']);
        prevTensor = prevTensor.matMul(variable);
      } else if (node.type === 'add') {
        const variable = cache.get(node.inputs['second-addend']);
        prevTensor = prevTensor.add(variable);
      }
      if (nodeOfInterest !== undefined && node.id === nodeOfInterest)
        return prevTensor;
      // Assuming only one output node
      node = dict.get(node.outputs[0]);
    }
    return prevTensor;
  };
  return {model, variables};
};

// Train the model.
export async function train(
    data: DataProvider, graph: Model.Graph,
    log: (text: string, weights: WeightUpdateInfo[]) => void) {
  if (!graph.isValid) {
    console.warn('Training broken graph');
    return;
  }
  const returnCost = true;

  const {model, variables} = generateModel(graph);

  for (let i = 0; i < TRAIN_STEPS; i++) {
    const cost = optimizer.minimize(() => {
      const batch = data.nextTrainBatch(BATCH_SIZE);
      return loss(batch.labels, model(batch.xs)) as any;
    }, returnCost, variables);

    log(`loss[${i}]: ${cost.dataSync()}`, writeWeightsToGraph(graph));

    await tf.nextFrame();
  }
}

// Predict the digit number from a batch of input images.
export function predict(graph: Model.Graph, x): Prediction {
  if (!graph.isValid) {
    console.warn('Evaluating broken graph');
    return;
  }
  const m = generateModel(graph).model(x);
  const pred = tf.tidy(() => {
    const axis = 1;
    return m.argMax(axis);
  });
  const uncertaintyPred = tf.tidy(() => {
    const axis = 1;
    return m.max(axis);
  });
  const activations = getActivations(graph, x);
  return {
    value: Array.from(pred.dataSync())[0] as number,
    uncertainty: Array.from(uncertaintyPred.dataSync())[0] as number,
    activations
  };
}

// Given a logits or label vector, return the class indices.
export function classesFromLabel(y) {
  const axis = 1;
  const pred = y.argMax(axis);

  return Array.from(pred.dataSync());
}

function getActivations(
    graph: Model.Graph, x): Map<string, Model.ActivationInfo> {
  const activations = new Map<string, Model.ActivationInfo>();
  {
    // For now only the output
    const outputNode =
        graph.nodes.find(n => n.node.type === 'output').node as Model.Output;
    const pred = tf.tidy(() => {
      return generateModel(graph).model(x);
    });
    const values = Array.from(pred.dataSync()) as number[];
    activations.set(outputNode.id, {shape: pred.shape, values});
  }
  for (let container of graph.nodes) {
    const {node} = container;
    if (node['inputs'] !== undefined) {
      const pred = tf.tidy(() => {
        return generateModel(graph, node.id).model(x);
      });
      const values = Array.from(pred.dataSync()) as number[];
      activations.set(node.id, {shape: pred.shape, values});
    }
  }
  return activations;
}

function writeWeightsToGraph(graph: Model.Graph): WeightUpdateInfo[] {
  return graph.nodes.filter(n => n.node.type === 'variable')
      .map(n => n.node)
      .map((node: Model.Variable) => {
        const v = cache.get(node.id);
        const values = Array.from(v.dataSync());
        return {nodeId: node.id, values};
      });
}
