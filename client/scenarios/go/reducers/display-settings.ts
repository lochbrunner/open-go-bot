import {Action} from 'redux-actions';

import * as Actions from '../actions/constants';
import {ActionPayload} from '../actions/display-settings';

export function createInitialState(): DisplaySettings {
  return {
    showForbidden: true,
    showLiberties: true,
    showIsLiberty: true,
    showNextMove: true
  };
}

export const reducers: (state: RootState, action: Action<ActionPayload>) =>
    RootState = (state: RootState, action: Action<ActionPayload>) => {
      if (action.type === Actions.TOGGLE_IS_LIBERTY_VIEW) {
        state.displaySettings.showIsLiberty = action.payload.nextValue;
        return {...state};
      }

      if (action.type === Actions.TOGGLE_LIBERTIES_VIEW) {
        state.displaySettings.showLiberties = action.payload.nextValue;
        return {...state};
      }

      if (action.type === Actions.TOGGLE_FORBIDDEN_VIEW) {
        state.displaySettings.showForbidden = action.payload.nextValue;
        return {...state};
      }

      if (action.type === Actions.TOGGLE_NEXT_MOVE_VIEW) {
        state.displaySettings.showNextMove = action.payload.nextValue;
        return {...state};
      }

      return state;
    };
