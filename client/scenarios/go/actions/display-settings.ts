import {createAction} from 'redux-actions';
import * as Actions from './constants';

export interface ActionPayload { nextValue; }
export const toggleLibertiesView =
    createAction<ActionPayload>(Actions.TOGGLE_LIBERTIES_VIEW);
export const toggleIsLibertyView =
    createAction<ActionPayload>(Actions.TOGGLE_IS_LIBERTY_VIEW);
export const toggleForbiddenView =
    createAction<ActionPayload>(Actions.TOGGLE_FORBIDDEN_VIEW);
export const toggleNextMoveView =
    createAction<ActionPayload>(Actions.TOGGLE_NEXT_MOVE_VIEW);