import * as dl from 'deeplearn';

import {TrainingsData} from '../actions/training';

export interface LearningProgress {
    description: string;
    progress: {finished: number, total: number};
  }
export default function train(reporter: (msg: LearningProgress) => void, trainigsData: TrainingsData) {
    const graph = new dl.Graph();
    const inputShape = [19,19,9];
    const inputTensor = graph.placeholder('input', inputShape);

    const labelShape = [19, 19];
    const labelTensor = graph.placeholder('label', labelShape);
    const w = graph.variable<'flaot32'>('w', new dl.RandomNormalInitializer([1,1,1]) )
    const outputTensor = graph.conv2d(inputTensor, )
    const costTensor = graph.softmaxCrossEntropyCost(labelTensor);

    const session = new dl.Session(graph, dl.ENV.math);
    // const cost = session.train()
}