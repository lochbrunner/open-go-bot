import { createAction } from 'redux-actions';
import * as Actions from '../constants/actions';

export const goBack = createAction(Actions.STEP_BACKWARD);
export const goForward = createAction(Actions.STEP_FORWARD);
