import * as _ from 'lodash';
import {createAction} from 'redux-actions';

import {argMax, make2d} from '../../../commons/utils';
import load from '../../go/load';

import * as Actions from './constants';
import {MnistData} from './data';

export interface ActionUpdateImagePayload {
  pixels: number[][];
  caret: number;
  groundTruth: number;
}
export interface ActionEmptyPayload {}

export interface ActionUpdatePixelPayload {
  x: number;
  y: number;
  value: number;
}

export interface ToggleAutoPredictPayload { nextValue: boolean; }

export type ActionUpdatePrediction = Prediction;

export type ActionPayload = ActionUpdateImagePayload|ActionUpdatePixelPayload|
    ActionEmptyPayload|ActionUpdatePrediction|ToggleAutoPredictPayload;

export const updateImage =
    createAction<ActionUpdateImagePayload>(Actions.MNIST_UPDATE_IMAGE);

export const updatePixel =
    createAction<ActionUpdatePixelPayload>(Actions.MNIST_UPDATE_PIXEL);

export const clearImage =
    createAction<ActionEmptyPayload>(Actions.MNIST_CLEAR_IMAGE);

export const mnistLoadTrainingDataFinished =
    createAction<ActionEmptyPayload>(Actions.MNIST_LOAD_TRAINING_DATA_FINISHED);

export const updatePrediction =
    createAction<ActionUpdatePrediction>(Actions.MNIST_UPDATE_PREDICTION);

export const toggleAutoPredict =
    createAction<ToggleAutoPredictPayload>(Actions.MNIST_TOGGLE_AUTO_PREDICT);

export const loadTrainingsData = (dataProvider: DataProvider) => {
  return dispatch => {
    dataProvider.load().then(() => {
      dispatch(mnistLoadTrainingDataFinished({}));
    });
  };
};

export const showImage =
    (dataProvider: DataProvider, index: number,
     callback?: (pixels: number[][]) => void) => {
      return dispatch => {
        const img = dataProvider.getSample(index);
        const flatData = Array.prototype.slice.call(img.feature) as number[];
        const labels = Array.prototype.slice.call(img.label);
        const groundTruth = argMax(labels);

        const pixels = make2d(flatData, 28);

        dispatch(updateImage({pixels, caret: index, groundTruth}));
        if (callback) callback(pixels);
      };
    };