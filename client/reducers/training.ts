import {Action} from 'redux-actions';

import * as Actions from '../constants/actions';
import {MnistData} from '../scenarios/mnist/actions/data';
import {Progress} from '../utilities/progress';

class EmptyData implements Training {
  training: {progress: {finished: number, total: number}; description: string;};

  constructor() {
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
        const payload = action.payload as Progress;
        state.training.training.description = payload.description;
        state.training.training.progress = payload.progress;
        const dict = new Map<string, Model.Variable>();
        state.graph.nodes.filter(n => n.type === 'variable')
            .forEach((v: Model.Variable) => dict.set(v.id, v));
        const {newWeights} = payload;
        newWeights.forEach(n => dict.get(n.nodeId).content = n.values);
        return {...state};
      }

      if (action.type === Actions.UPDATE_WEIGHTS) {
        state.graph = action.payload as Model.Graph;
        return {...state};
      }

      return state;
    };
