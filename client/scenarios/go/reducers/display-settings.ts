import {Action} from 'redux-actions';

import * as Actions from '../actions/constants';
import {ActionSettingsPayload} from '../actions/display-settings';

export function createInitialState(): DisplaySettings {
  return {
    showForbidden: true,
    showLiberties: true,
    showIsLiberty: true,
    showNextMove: true
  };
}

export const reducers:
    (state: RootState, action: Action<ActionSettingsPayload>) => RootState =
        (state: RootState, action: Action<ActionSettingsPayload>) => {
          if (action.type === Actions.TOGGLE_IS_LIBERTY_VIEW) {
            state.go.displaySettings.showIsLiberty = action.payload.nextValue;
            return {
              ...state,
              go: {
                ...state.go,
                displaySettings: {
                  ...state.go.displaySettings,
                  showIsLiberty: action.payload.nextValue
                }
              }
            };
          }

          if (action.type === Actions.TOGGLE_LIBERTIES_VIEW) {
            return {
              ...state,
              go: {
                ...state.go,
                displaySettings: {
                  ...state.go.displaySettings,
                  showLiberties: action.payload.nextValue
                }
              }
            };
          }

          if (action.type === Actions.TOGGLE_FORBIDDEN_VIEW) {
            return {
              ...state,
              go: {
                ...state.go,
                displaySettings: {
                  ...state.go.displaySettings,
                  showForbidden: action.payload.nextValue
                }
              }
            };
          }

          if (action.type === Actions.TOGGLE_NEXT_MOVE_VIEW) {
            return {
              ...state,
              go: {
                ...state.go,
                displaySettings: {
                  ...state.go.displaySettings,
                  showNextMove: action.payload.nextValue
                }
              }
            };
          }

          return state;
        };
