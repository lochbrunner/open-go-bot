import {createAction} from 'redux-actions';
import * as Actions from './constants';

export interface ActionSettingsPayload { nextValue; }
export const toggleLibertiesView =
    createAction<ActionSettingsPayload>(Actions.TOGGLE_LIBERTIES_VIEW);
export const toggleIsLibertyView =
    createAction<ActionSettingsPayload>(Actions.TOGGLE_IS_LIBERTY_VIEW);
export const toggleForbiddenView =
    createAction<ActionSettingsPayload>(Actions.TOGGLE_FORBIDDEN_VIEW);
export const toggleNextMoveView =
    createAction<ActionSettingsPayload>(Actions.TOGGLE_NEXT_MOVE_VIEW);