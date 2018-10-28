import * as tf from '@tensorflow/tfjs';
import {Rank, Tensor} from '@tensorflow/tfjs';

import {MnistData} from '../../scenarios/mnist/actions/data';

// import {MnistData} from './data';

// Hyper-parameters.
const LEARNING_RATE = .1;
const BATCH_SIZE = 64;
const TRAIN_STEPS = 100;

// Data constants.
const IMAGE_SIZE = 28;
const LABELS_SIZE = 10;
const optimizer = tf.train.sgd(LEARNING_RATE);

// Variables that we want to optimize
const conv1OutputDepth = 8;
const conv1Weights =
    tf.variable(tf.randomNormal([5, 5, 1, conv1OutputDepth], 0, 0.1));

const conv2InputDepth = conv1OutputDepth;
const conv2OutputDepth = 16;
const conv2Weights = tf.variable(
    tf.randomNormal([5, 5, conv2InputDepth, conv2OutputDepth], 0, 0.1));

const fullyConnectedWeights = tf.variable(tf.randomNormal(
    [7 * 7 * conv2OutputDepth, LABELS_SIZE], 0,
    1 / Math.sqrt(7 * 7 * conv2OutputDepth)));
const fullyConnectedBias = tf.variable(tf.zeros([LABELS_SIZE]));

// Loss function
function loss(labels, ys) {
  return tf.losses.softmaxCrossEntropy(labels, ys).mean();
}

// Our actual model
function model(inputXs: any) {
  const xs = inputXs.as4D(-1, IMAGE_SIZE, IMAGE_SIZE, 1);

  const strides = 2;
  const pad = 0;

  // Conv 1
  const layer1 = tf.tidy(() => {
    return xs.conv2d(conv1Weights, 1, 'same')
        .relu()
        .maxPool([2, 2], strides, pad);
  });

  // Conv 2
  const layer2 = tf.tidy(() => {
    return layer1.conv2d(conv2Weights, 1, 'same')
        .relu()
        .maxPool([2, 2], strides, pad);
  });

  // Final layer
  return layer2.as2D(-1, fullyConnectedWeights.shape[0])
      .matMul(fullyConnectedWeights)
      .add(fullyConnectedBias);
}

// Train the model.
export async function train(data: DataProvider, log: (text: string) => void) {
  const returnCost = true;

  for (let i = 0; i < TRAIN_STEPS; i++) {
    const cost = optimizer.minimize(() => {
      const batch = data.nextTrainBatch(BATCH_SIZE);
      return loss(batch.labels, model(batch.xs)) as any;
    }, returnCost);

    log(`loss[${i}]: ${cost.dataSync()}`);

    await tf.nextFrame();
  }
}

// Predict the digit number from a batch of input images.
export function predict(x): Prediction {
  const m = model(x);
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