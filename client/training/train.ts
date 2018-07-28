import * as tf from '@tensorflow/tfjs';

export interface Progress {
  description: string;
  progress: {finished: number, total: number};
}

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

export default async function trainOnRecords(
    reporter: (msg: Progress) => void, trainingsData: TrainingsData) {
  console.log('Training..');

  const model = tf.sequential();

  model.add(tf.layers.conv2d({
    inputShape: [19, 19, 9],
    kernelSize: 5,  // 5x5 kernel
    filters: 1,     // For the output
    strides: 1,
    activation: 'relu',
    padding: 'same',
    kernelInitializer: 'VarianceScaling',
    useBias: true
  }));

  // model.add(tf.layers.dense({
  //   units: 19 * 19,
  //   kernelInitializer: 'VarianceScaling',
  //   activation: 'softmax'
  // }));
  model.add(tf.layers.flatten());

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
  const TRAIN_BATCHES = 40;

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

            console.log(d);
          });
        }

        reporter({
          description: `Training loss: ${loss} accuracy: ${accuracy}`,
          progress: {total: TRAIN_BATCHES, finished: i}
        });
      });
    }
  }

  // const graph = new dl.Graph();
  // const inputShape = [19, 19, 9];
  // const inputTensor = graph.placeholder('input', inputShape);

  // const labelShape = [19, 19];
  // const labelTensor = graph.placeholder('label', labelShape);
  //   const w =
  //       graph.variable<'float32'>('w', new dl.RandomNormalInitializer([1, 1,
  //       1]))
  //           const outputTensor = graph.conv2d(
  //           inputTensor,
  //           ) const costTensor = graph.softmaxCrossEntropyCost(labelTensor);

  // const session = new dl.Session(graph, dl.ENV.math);
  // const cost = session.train()
}