import {combineReducers, Reducer} from 'redux';
import {Action} from 'redux-actions';

import * as Actions from '../constants/actions';

import {createInitialState as initialDisplaySettings, reducers as displaySettingsReducer} from './display-settings';
import {createInitialState as initialGame, reducers as gameReducer} from './game';
import {createInitialState as initialTraining, reducers as trainingReducers} from './training';

function createInitialState(): RootState {
  return {
    game: initialGame(),
    displaySettings: initialDisplaySettings(),
    training: initialTraining()
  };
}

const reducer: Reducer<RootState> =
    (state: RootState = createInitialState(), action: Action<any>) => {
      state = gameReducer(state, action);
      state = displaySettingsReducer(state, action);
      state = trainingReducers(state, action);
      return state;
    };

export default reducer;
