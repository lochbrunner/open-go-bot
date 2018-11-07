import * as tf from '@tensorflow/tfjs';
import {createAction} from 'redux-actions';

import * as Actions from '../../constants/actions';
import {Progress} from '../../utilities/progress';

import {predict} from './mnist';
import {Loader, trainMnist, trainOnRecords} from './train';

export const updateTrainingsProgress =
    createAction<Progress>(Actions.UPDATE_TRAINING_PROGRESS);

export const updateWeights = createAction<Model.Graph>(Actions.UPDATE_WEIGHTS);

// export const train = (loader: Loader, graph: Model.Graph) => {
//   return dispatch => trainOnRecords(loader, dispatch, graph);
//   return dispatch => trainMnist(loader, dispatch);
// };

export const train = (dataProvider: DataProvider, graph: Model.Graph) => {
  // return dispatch => trainOnRecords(loader, dispatch, graph);
  return dispatch => trainMnist(dataProvider, graph, dispatch);
};

export const predictAction =
    (graph: Model.Graph, callback: (prediction: Prediction) => void,
     feature: number[][]) => dispatch => {
      const dim = 28;
      const buffer = new Float32Array(dim * dim);
      for (let x = 0; x < dim; ++x) {
        for (let y = 0; y < dim; ++y) {
          buffer[y * dim + x] = feature[y][x];
        }
      }
      const p = predict(graph, tf.tensor2d(buffer, [1, dim * dim]));
      callback(p);
    };
