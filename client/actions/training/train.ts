import * as tf from '@tensorflow/tfjs';
import {setTimeout} from 'timers';

import {updateTrainingsProgress, updateWeights} from '../../actions/training';
import {Progress} from '../../utilities/progress';
import {createModel, writeWeightsToGraph} from '../../utilities/tf-model';

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

async function interrupt() {
  return new Promise((resolve, reject) => {
    setImmediate(() => resolve());
  });
}

async function sleep(duration: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), duration);
  });
}

function updateGraph(dispatch: any, graph: Model.Graph, model: tf.Model) {
  tf.tidy(() => {
    graph = writeWeightsToGraph(graph, model);
    dispatch(updateWeights({...graph}));
  });
}

export default async function trainOnRecords(
    dispatch: any, graph: Model.Graph) {
  const reporter = (progress: Progress) =>
      dispatch(updateTrainingsProgress(progress));

  const trainingsData = await load(reporter, 512);

  console.log('Training..');

  tf.setBackend('webgl');

  const model = createModel(graph);

  // Training

  // How many examples the model should "see" before making a parameter update.
  const BATCH_SIZE = 64;
  // How many batches to train the model for.
  const TRAIN_BATCHES = 16;

  // Every TEST_ITERATION_FREQUENCY batches, test accuracy over TEST_BATCH_SIZE
  // examples. Ideally, we'd compute accuracy over the whole test set, but for
  // performance reasons we'll use a subset.
  const TEST_BATCH_SIZE = 1000;
  const TEST_ITERATION_FREQUENCY = 2;

  const batchHandler = new BatchHandler(trainingsData);
  updateGraph(dispatch, graph, model);
  // publishWeights(dispatch, model, layers, graph);

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
    const accuracy = history.history.acc[0] as number;

    console.log(`loss: ${loss}, accuracy: ${(accuracy * 100).toFixed(2)}%`);

    if (i % TEST_ITERATION_FREQUENCY === 0 || i === TRAIN_BATCHES - 1) {
      if (loss > 10 || loss < .01) {
        reporter({
          description: `Aborted`,
          progress: {total: TRAIN_BATCHES, finished: 0}
        });
        break;
      }
      // await publishWeights(dispatch, model, layers, graph);
      updateGraph(dispatch, graph, model);

      await sleep(50);
      reporter({
        description:
            `Training loss: ${
                              (loss as number).toFixed(3)
                            } accuracy: ${(accuracy * 100).toFixed(2)}%`,
        progress: {total: TRAIN_BATCHES, finished: i}
      });
    }
  }
  // await publishWeights(dispatch, model, layers, graph);
  updateGraph(dispatch, graph, model);
}