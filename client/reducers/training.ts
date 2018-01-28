import {handleActions} from 'redux-actions';
import * as Actions from '../constants/actions';
import {Action} from 'redux';
import {TrainingProgress} from '../training/load';

class EmptyData implements Training {
  loading: {
    progress: {finished: number, total: number};
    description: string;
  };
  features: number[][][];
  labels: number[];

  constructor() {
    this.features = [];
    this.labels = [];
    this.loading = {
      progress: {finished: 0, total: 1},
      description: 'No samples load yet'
    };
  }
}

export default handleActions<Training, TrainingProgress>({
  [Actions.UPDATE_LOADING_PROGRESS]: (state, action) => {
    state.loading = action.payload;
    return {...state};
  },
  [Actions.LOAD_DATA]: (state, action) => {
    return state;
  },
}, new EmptyData());