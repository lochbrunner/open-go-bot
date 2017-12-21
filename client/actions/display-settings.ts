import {createAction} from 'redux-actions';
import * as Actions from '../constants/actions';

export interface ActionPayload { nextValue; }
export const toggleLibertiesView =
    createAction<ActionPayload>(Actions.TOGGLE_LIBERTIES_VIEW);
export const toggleIsLibertyView =
    createAction<ActionPayload>(Actions.TOGGLE_IS_LIBERTY_VIEW);
export const toggleForbiddenView =
    createAction<ActionPayload>(Actions.TOGGLE_FORBIDDEN_VIEW);