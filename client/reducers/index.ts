import {Reducer} from 'redux';
import {Action} from 'redux-actions';

// TODO(mnist): Make this file scenario independent
import {createInitialState as initialGo, reducers as goReducers} from '../scenarios/go/reducers';

import {createInitialState as initialGraph, reducers as graphReducers} from './graph';
import {createInitialState as initialTraining, reducers as trainingReducers} from './training';

function createInitialState(): RootState {
  return {go: initialGo(), training: initialTraining(), graph: initialGraph()};
}

const reducer: Reducer<RootState> =
    (state: RootState = createInitialState(), action: Action<any>) => {
      state = goReducers(state, action);
      state = trainingReducers(state, action);
      state = graphReducers(state, action as any);
      return state;
    };

export default reducer;
