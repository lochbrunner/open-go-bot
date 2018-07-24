import {createAction} from 'redux-actions';
import * as Actions from '../constants/actions';
import {TrainingProgress} from '../training/load';

// export interface TrainingsData {
//   features: number[][][][];
//   labels: number[][];
// }
export const loadData = createAction<TrainingsData>(Actions.LOAD_DATA);

export const updateProgress =
    createAction<TrainingProgress>(Actions.UPDATE_LOADING_PROGRESS);

export const updateTrainingsProgress =
    createAction<TrainingProgress>(Actions.UPDATE_TRAINING_PROGRESS);

// export const ;