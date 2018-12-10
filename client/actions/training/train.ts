import * as tf from '@tensorflow/tfjs';
import {setTimeout} from 'timers';

import {updateTrainingsProgress, updateWeights} from '../../actions/training';
import {Progress, WeightUpdateInfo} from '../../utilities/progress';
import {createModel, writeWeightsToGraph} from '../../utilities/tf-model';

import * as Mnist from './mnist';

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

async function sleep(duration: number) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), duration);
  });
}

function updateGraph(
    dispatch: (ActionFunctions) => void, graph: Model.Graph, model: tf.Model) {
  tf.tidy(() => {
    graph = writeWeightsToGraph(graph, model);
    dispatch(updateWeights({...graph}));
  });
}

export interface TrainingData {
  features: number[][][][];
  labels: number[][];
}

export type Loader =
    (reporter: (progress: Progress) => any, maxSamples: number) =>
        Promise<TrainingData>;

// Deprecated
export async function trainOnRecords(
    loader: Loader, dispatch: (ActionFunctions) => void, graph: Model.Graph) {
  const reporter = (progress: Progress) =>
      dispatch(updateTrainingsProgress(progress));

  const trainingsData = await loader(reporter, 2048);

  tf.setBackend('webgl');

  const model = createModel(graph, 0.05);

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
          progress: {total: TRAIN_BATCHES, finished: 0},
          newWeights: []
        });
        break;
      }
      updateGraph(dispatch, graph, model);

      await sleep(50);
      reporter({
        description:
            `Training loss: ${
                              (loss as number).toFixed(3)
                            } accuracy: ${(accuracy * 100).toFixed(2)}%`,
        progress: {total: TRAIN_BATCHES, finished: i},
        newWeights: []
      });
    }
    tf.dispose([features, labels, validationData]);
    await tf.nextFrame();
  }

  updateGraph(dispatch, graph, model);
}

export async function trainMnist(
    data: DataProvider, graph: Model.Graph,
    dispatch: (ActionFunctions) => void) {
  const reporter = (progress: Progress) =>
      dispatch(updateTrainingsProgress(progress));
  const log = (text: string, newWeights: WeightUpdateInfo[]) => reporter(
      {description: text, progress: {finished: 0, total: 1}, newWeights});
  await Mnist.train(data, graph, log);
}