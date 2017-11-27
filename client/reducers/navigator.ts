import { handleActions } from 'redux-actions';
import * as immutlable from 'immutable';
import * as Actions from '../constants/actions';

const initialRecord = immutlable.Record({
    step: 0
});

const initialState = new initialRecord();

export default handleActions<immutlable.Map<string, any>, void>({
    [Actions.STEP_FORWARD]: (state, action) => state.set('step', state.get('step') + 1),
    [Actions.STEP_BACKWARD]: (state, action) => state.set('step', state.get('step') - 1),
}, initialState);