import {Action} from 'redux-actions';

import * as Actions from '../constants/actions';
import {MnistData} from '../scenarios/mnist/actions/data';
import {Progress} from '../utilities/progress';

class EmptyData implements Training {
  training: {progress: {finished: number, total: number}; description: string;};
  trainingsData: TrainingsData;
  dataProvider: DataProvider;  // TODO(go): Generalize this

  constructor() {
    this.trainingsData = {features: [], labels: []};
    this.dataProvider = new MnistData();
    this.training = {
      progress: {finished: 0, total: 1},
      description: 'No samples load yet'
    };
  }
}

export type actionTypes = Progress|Model.Graph;

export const createInitialState: () => Training = () => new EmptyData();

export const reducers: (state: RootState, action: Action<actionTypes>) =>
    RootState = (state: RootState, action: Action<actionTypes>) => {
      if (action.type === Actions.UPDATE_TRAINING_PROGRESS) {
        state.training.training = action.payload as Progress;
        return {...state};
      }

      if (action.type === Actions.UPDATE_WEIGHTS) {
        state.graph = action.payload as Model.Graph;
        return {...state};
      }

      return state;
    };
