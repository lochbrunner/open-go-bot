import { createAction } from 'redux-actions';
import * as Actions from '../constants/actions';

export interface Vector2d{
    x: number;
    y:number;
}

export interface ActionPayload {
    pos: Vector2d, 
    player: Player,
    fieldWidth: number;
} 
export const setStone = createAction<ActionPayload>(Actions.SET_STONE);