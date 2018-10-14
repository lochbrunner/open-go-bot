import {combineReducers, Reducer} from 'redux';
import {Action} from 'redux-actions';

// TODO: Make this file scenario independent
import {createInitialState as initialGame, reducers as gameReducer} from '../scenarios/go/reducers';

import {createInitialState as initialDisplaySettings, reducers as displaySettingsReducer} from '../scenarios/go/reducers/display-settings';
import {createInitialState as initialGraph, reducers as graphReducers} from './graph';
import {actionTypes as GraphActions, createInitialState as initialTraining, reducers as trainingReducers} from './training';

function createInitialState(): RootState {
  return {
    game: initialGame(),
    displaySettings: initialDisplaySettings(),
    training: initialTraining(),
    graph: initialGraph()
  };
}

const reducer: Reducer<RootState> =
    (state: RootState = createInitialState(), action: Action<any>) => {
      state = gameReducer(state, action);
      state = displaySettingsReducer(state, action);
      state = trainingReducers(state, action);
      state = graphReducers(state, action as any);
      return state;
    };

export default reducer;
