import {Action} from 'redux-actions';
import {handleActions} from 'redux-actions';

import * as Actions from '../../constants/actions';
import {Progress as LoadingProgress} from './load';
import {Progress as TrainingProgress} from './train';

class EmptyData implements Training {
  loading: {progress: {finished: number, total: number}; description: string;};
  training: {progress: {finished: number, total: number}; description: string;};
  trainingsData: TrainingsData;

  constructor() {
    this.trainingsData = {features: [], labels: []};
    this.loading = {
      progress: {finished: 0, total: 1},
      description: 'No samples load yet'
    };
    this.training = {
      progress: {finished: 0, total: 1},
      description: 'No samples load yet'
    };
  }
}

export type actionTypes = LoadingProgress|TrainingProgress|TrainingsData;

export const createInitialState: () => Training = () => new EmptyData();

export const reducers: (state: RootState, action: Action<actionTypes>) =>
    RootState = (state: RootState, action: Action<actionTypes>) => {
      if (action.type === Actions.UPDATE_LOADING_PROGRESS) {
        state.training.loading = action.payload as LoadingProgress;
        return state;
      }
      if (action.type === Actions.UPDATE_TRAINING_PROGRESS) {
        state.training.loading = action.payload as LoadingProgress;
        return state;
      }
      if (action.type === Actions.UPDATE_LOADING_PROGRESS) {
        state.training.training = action.payload as LoadingProgress;
        return state;
      }

      if (action.type === Actions.LOAD_DATA) {
        state.training.trainingsData = action.payload as TrainingsData;
        return state;
      }
      return state;
    };
