import * as tf from '@tensorflow/tfjs';
import {Model, Rank, Tensor} from '@tensorflow/tfjs';

import {MnistData} from '../../scenarios/mnist/actions/data';

// import {MnistData} from './data';

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
  graph.nodes.forEach(node => dict.set(node.id, node));
  return dict;
}

const cache = new Map<string, tf.Variable>();

const getVariable = (id: string, factory: () => tf.Tensor): tf.Variable => {
  if (cache.has(id)) return cache.get(id);
  const variable = tf.variable(factory());
  cache.set(id, variable);
  return variable;
};

const generateModel = (graph: Model.Graph) => {
  const dict = createDict(graph);
  const input = dict.get(graph.input);

  const variables =
      graph.nodes.filter(node => node.type === 'variable').map(node => {
        const v = node as Model.Variable;
        const {shape} = v;
        if (v.init === 'normal') {
          const {mean, stdDev} = v;
          return getVariable(v.id, () => tf.randomNormal(shape, mean, stdDev));
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
    let prevTensor: any;
    while (node.outputs[0] !== 'result') {
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
        const variable = cache.get(node.inputs[1]);
        prevTensor = prevTensor.conv2d(variable, 1, 'same');
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
        const variable = cache.get(node.inputs[1]);
        prevTensor = prevTensor.matMul(variable);
      } else if (node.type === 'add') {
        const variable = cache.get(node.inputs[1]);
        prevTensor = prevTensor.add(variable);
      }
      // Assuming only one output node
      node = dict.get(node.outputs[0]);
    }
    return prevTensor;
  };
  return {model, variables};
};

// Train the model.
export async function train(
    data: DataProvider, graph: Model.Graph, log: (text: string) => void) {
  const returnCost = true;

  const {model, variables} = generateModel(graph);

  for (let i = 0; i < TRAIN_STEPS; i++) {
    const cost = optimizer.minimize(() => {
      const batch = data.nextTrainBatch(BATCH_SIZE);
      return loss(batch.labels, model(batch.xs)) as any;
    }, returnCost, variables);

    log(`loss[${i}]: ${cost.dataSync()}`);

    await tf.nextFrame();
  }
}

// Predict the digit number from a batch of input images.
export function predict(graph: Model.Graph, x): Prediction {
  const m = generateModel(graph).model(x);
  const pred = tf.tidy(() => {
    const axis = 1;
    return m.argMax(axis);
  });
  const uncertaintyPred = tf.tidy(() => {
    const axis = 1;
    return m.max(axis);
  });
  return {
    value: Array.from(pred.dataSync())[0] as number,
    uncertainty: Array.from(uncertaintyPred.dataSync())[0] as number
  };
}

// Given a logits or label vector, return the class indices.
export function classesFromLabel(y) {
  const axis = 1;
  const pred = y.argMax(axis);

  return Array.from(pred.dataSync());
}