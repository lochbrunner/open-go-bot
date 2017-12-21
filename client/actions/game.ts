import {createAction} from 'redux-actions';
import * as Actions from '../constants/actions';

export interface Vector2d {
  x: number;
  y: number;
}

export interface ActionPayload {
  pos: Vector2d;
  player: Player;
  fieldWidth: number;
  fieldHeight: number;
}

export const setStone = createAction<ActionPayload>(Actions.SET_STONE);
export const resetGame = createAction<void>(Actions.RESET_GAME);
export const stepBackward = createAction<void>(Actions.STEP_BACKWARD);
export const stepForward = createAction<void>(Actions.STEP_FORWARD);