import {createAction} from 'redux-actions';

import {make2d} from '../../../commons/utils';
import load from '../../go/load';

import * as Actions from './constants';
import {MnistData} from './data';

export interface ActionUpdateImagePayload {
  pixels: number[][];
  caret: number;
}
export interface ActionEmptyPayload {}

export interface ActionUpdatePixelPayload {
  x: number;
  y: number;
  value: number;
}

export type ActionPayload =
    ActionUpdateImagePayload|ActionUpdatePixelPayload|ActionEmptyPayload;

export const updateImage =
    createAction<ActionUpdateImagePayload>(Actions.UPDATE_IMAGE);

export const updatePixel =
    createAction<ActionUpdatePixelPayload>(Actions.UPDATE_PIXEL);

export const clearImage = createAction<ActionEmptyPayload>(Actions.CLEAR_IMAGE);

export const mnistLoadTrainingDataFinished =
    createAction<ActionEmptyPayload>(Actions.MNIST_LOAD_TRAINING_DATA_FINISHED);

// Data
const data = new MnistData();

export const loadTrainigsData = () => {
  return dispatch => {
    data.load().then(() => {
      dispatch(mnistLoadTrainingDataFinished({}));
    });
  };
};

export const showImage = (index: number) => {
  return dispatch => {
    const flatData =
        Array.prototype.slice.call(data.getImage(index)) as number[];

    dispatch(updateImage({pixels: make2d(flatData, 28), caret: index}));
  };
};