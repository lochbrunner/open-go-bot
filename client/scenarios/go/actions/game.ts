import {createAction} from 'redux-actions';

import * as Actions from './constants';

export interface TurnPayload {
  pos: Vector2d;
  player: Player;
}

export type ActionGoGamePayload = TurnPayload|string;

export const setStone = createAction<TurnPayload>(Actions.SET_STONE);
export const resetGame = createAction<void>(Actions.RESET_GAME);
export const stepForward = createAction<void>(Actions.STEP_FORWARD);
export const loadGame = createAction<string>(Actions.LOAD_GAME);
