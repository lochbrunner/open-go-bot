import { handleActions } from 'redux-actions';
import * as immutlable from 'immutable';
import * as Actions from '../constants/actions';
import {ActionPayload} from '../actions/display-settings';

const initialRecord = immutlable.Record({
    showLiberties: true
});

const initialState = new initialRecord();

export default handleActions<immutlable.Map<string, any>, ActionPayload>({
    [Actions.TOGGLE_LIBERTIES_VIEW]: (state, action) => state.set('showLiberties', action.payload.nextValue)
}, initialState);