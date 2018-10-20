import {Action} from 'redux-actions';

import * as Actions from '../actions/constants';
import {ActionGoGamePayload, TurnPayload} from '../actions/game';

import {createInitialState as settingsCreateInitialState, reducers as settingsReducer} from './display-settings';
import {EmptyGame, loadGame, nextStep, putStone} from './game-logic';

export type ActionType = 'Actions.SET_STONE';

export function createInitialState(): Go {
  return {game: new EmptyGame(), displaySettings: settingsCreateInitialState()};
}

export const actionNames = [Actions.SET_STONE];

export const reducers:
    (state: RootState, action: Action<ActionGoGamePayload>) => RootState =
        (state: RootState, action: Action<ActionGoGamePayload>) => {
          if (action.type === Actions.SET_STONE) {
            return {
              ...state,
              go: {
                ...state.go,
                game: putStone(state.go.game, action.payload as TurnPayload)
              }
            };
          }

          if (action.type === Actions.RESET_GAME) {
            return {...state, go: {...state.go, game: new EmptyGame()}};
          }

          if (action.type === Actions.LOAD_GAME) {
            return {
              ...state,
              go: {
                ...state.go,
                game: loadGame(state.go.game, action.payload as string)
              }
            };
          }

          if (action.type === Actions.STEP_FORWARD) {
            return {...state, go: {...state.go, game: nextStep(state.go.game)}};
          }
          state = settingsReducer(state, action as any);
          return state;
        };
