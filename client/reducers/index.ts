import {Reducer} from 'redux';
import {Action} from 'redux-actions';

// TODO(github): Make this file scenario independent
// Might be interesting: https://github.com/ioof-holdings/redux-dynamic-reducer
// or http://nicolasgallagher.com/redux-modules-and-code-splitting/
import * as Go from '../scenarios/go';
import * as Mnist from '../scenarios/mnist';

import {reducers as graphReducers} from './graph';
import {createInitialState as initialTraining, reducers as trainingReducers} from './training';

function createInitialState(): RootState {
  return {
    go: Go.createInitialState(),
    mnist: Mnist.createInitialState(),
    training: initialTraining(),
    graph: {isValid: false, nodes: []}
  };
}

const reducer: Reducer<RootState> =
    (state: RootState = createInitialState(), action: Action<any>) => {
      state = Go.reducers(state, action);
      state = Mnist.reducers(state, action);
      state = trainingReducers(state, action);
      state = graphReducers(state, action as any);
      return state;
    };

export default reducer;
