import * as tf from '@tensorflow/tfjs';

import {updateTrainingsProgress, updateWeights} from '../../actions/training';
import {Progress} from '../../utilities/progress';
import load from './load';

class BatchHandler {
  private caret: number;
  constructor(private trainingsData: TrainingsData) {
    this.caret = 0;
  }

  nextBatch(size: number) {
    if (this.caret + size > this.trainingsData.features.length) this.caret = 0;

    const features: tf.Tensor4D = tf.tensor(
        this.trainingsData.features.slice(this.caret, this.caret + size));
    const labels: tf.Tensor3D = tf.tensor(
        this.trainingsData.labels.slice(this.caret, this.caret + size));
    return {features, labels};
  }
}

function calcWeightsSize(node: Model.Node) {
  if (node.type === 'convolution') {
    const inputShape = node.input.shape;
    return node.kernel.size * node.kernel.size * node.filters *
        inputShape[inputShape.length - 1];
  }
  return 0;
}

export default async function trainOnRecords(dispatch, graph: Model.Graph) {
  const reporter = (progress: Progress) =>
      dispatch(updateTrainingsProgress(progress));

  const trainingsData = await load(reporter);

  console.log('Training..');

  const model = tf.sequential();

  const layers = [] as Model.Node[];

  // Traverse all nodes
  let nodes: Model.Node[] = [graph.input];
  while (nodes.length > 0) {
    const node = nodes.pop();
    if (node.type === 'convolution') {
      model.add(tf.layers.conv2d({
        inputShape: node.input.shape,
        filters: node.filters,
        kernelSize: node.kernel.size,
        strides: node.strides,
        activation: node.activation,
        padding: 'same',
        kernelInitializer: 'VarianceScaling',
        useBias: true
      }));
      layers.push(node);
    } else if (node.type === 'flatten') {
      model.add(tf.layers.flatten());
      layers.push(node);
    }
    nodes.push(...node.outputs);
  }

  const LEARNING_RATE = 0.15;
  const optimizer = tf.train.sgd(LEARNING_RATE);

  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  // Training

  // How many examples the model should "see" before making a parameter update.
  const BATCH_SIZE = 64;
  // How many batches to train the model for.
  const TRAIN_BATCHES = 2;

  // Every TEST_ITERATION_FREQUENCY batches, test accuracy over TEST_BATCH_SIZE
  // examples. Ideally, we'd compute accuracy over the whole test set, but for
  // performance reasons we'll use a subset.
  const TEST_BATCH_SIZE = 1000;
  const TEST_ITERATION_FREQUENCY = 20;

  const batchHandler = new BatchHandler(trainingsData);

  // let caret = 0;
  for (let i = 0; i < TRAIN_BATCHES; i++) {
    const {features, labels} = batchHandler.nextBatch(BATCH_SIZE);

    let validationData;
    // Every few batches test the accuracy of the mode.
    if (i % TEST_ITERATION_FREQUENCY === 0) {
      const valSet = batchHandler.nextBatch(TEST_BATCH_SIZE);
      validationData = [valSet.features, valSet.labels];
    }

    const history = await model.fit(
        features, labels, {batchSize: BATCH_SIZE, validationData, epochs: 1});

    const loss = history.history.loss[0];
    const accuracy = history.history.acc[0];

    if (i % TEST_ITERATION_FREQUENCY === 0) {
      setImmediate(() => {
        console.log(`loss: ${loss}, accuracy: ${accuracy}`);

        const weights = model.getWeights(true);

        for (let weight of weights) {
          weight.data().then(d => {

            for (let layer of layers) {
              // console.log(
              //     `calc: ${calcWeightsSize(layer)} d.length: ${d.length}`);
              if (layer.type === 'convolution' &&
                  calcWeightsSize(layer) === d.length) {
                layer.weights = Array.from(d);
              }
            }
            console.log(d);
            // TODO(Matthias): How get the correct mapping?

            dispatch(updateWeights({...graph}));
          });
        }
        reporter({
          description: `Training loss: ${
                                         (loss as number).toFixed(2)
                                       } accuracy: ${accuracy}`,
          progress: {total: TRAIN_BATCHES, finished: i}
        });
      });
    }
  }
}