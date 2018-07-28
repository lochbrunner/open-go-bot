import {Action} from 'redux';
import {handleActions} from 'redux-actions';

import * as Actions from '../constants/actions';
import {Progress as LoadingProgress} from '../training/load';
import {Progress as TrainingProgress} from '../training/train';

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

export default handleActions<
    Training, LoadingProgress|TrainingProgress|TrainingsData>(
    {
      [Actions.UPDATE_LOADING_PROGRESS]: (state, action) => {
        state.loading = action.payload as LoadingProgress;
        return {...state};
      },
      [Actions.UPDATE_TRAINING_PROGRESS]: (state, action) => {
        state.training = action.payload as TrainingProgress;
        return {...state};
      },
      [Actions.LOAD_DATA]: (state, action) => {
        state.trainingsData = action.payload as TrainingsData;
        return state;
      },
    },
    new EmptyData());