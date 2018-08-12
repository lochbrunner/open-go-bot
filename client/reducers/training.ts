import {Action} from 'redux-actions';
import {handleActions} from 'redux-actions';

import * as Actions from '../constants/actions';
import {Progress} from '../utilities/progress';

class EmptyData implements Training {
  training: {progress: {finished: number, total: number}; description: string;};
  trainingsData: TrainingsData;

  constructor() {
    this.trainingsData = {features: [], labels: []};
    this.training = {
      progress: {finished: 0, total: 1},
      description: 'No samples load yet'
    };
  }
}

export type actionTypes = Progress;

export const createInitialState: () => Training = () => new EmptyData();

export const reducers: (state: RootState, action: Action<actionTypes>) =>
    RootState = (state: RootState, action: Action<actionTypes>) => {
      if (action.type === Actions.UPDATE_TRAINING_PROGRESS) {
        state.training.training = action.payload as Progress;
        return state;
      }

      return state;
    };
