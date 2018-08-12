import {createAction} from 'redux-actions';
import * as Actions from '../constants/actions';
import {Progress as LoadingProgress} from '../reducers/training/load';
import {Progress as TrainingProgress} from '../reducers/training/train';

// export interface TrainingsData {
//   features: number[][][][];
//   labels: number[][];
// }
export const loadData = createAction<TrainingsData>(Actions.LOAD_DATA);

export const updateLoadingProgress =
    createAction<LoadingProgress>(Actions.UPDATE_LOADING_PROGRESS);

export const updateTrainingsProgress =
    createAction<TrainingProgress>(Actions.UPDATE_TRAINING_PROGRESS);

// export const ;