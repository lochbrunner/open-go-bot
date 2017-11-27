import { createAction } from 'redux-actions';
import * as Actions from '../constants/actions';

export interface ActionPayload {
    nextValue;
}
export const toggleLibertiesView = createAction<ActionPayload>(Actions.TOGGLE_LIBERTIES_VIEW);