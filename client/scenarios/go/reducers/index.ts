import {Action, handleActions} from 'redux-actions';

import * as Actions from '../actions/constants';

import {ActionPayload, TurnPayload} from '../actions/game';
import {EmptyGame, loadGame, nextStep, putStone} from './game-logic';

export type ActionType = 'Actions.SET_STONE';

export function createInitialState(): Game {
  return new EmptyGame();
}

export const actionNames = [
  Actions.SET_STONE,
];

export const reducers: (state: RootState, action: Action<ActionPayload>) =>
    RootState = (state: RootState, action: Action<ActionPayload>) => {
      if (action.type === Actions.SET_STONE) {
        return {
          ...state,
          game: putStone(state.game, action.payload as TurnPayload)
        };
      }

      if (action.type === Actions.RESET_GAME) {
        return {...state, game: createInitialState()};
      }

      if (action.type === Actions.LOAD_GAME) {
        return {...state, game: loadGame(state.game, action.payload as string)};
      }

      if (action.type === Actions.STEP_FORWARD) {
        return {...state, game: nextStep(state.game)};
      }
      return state;
    };
