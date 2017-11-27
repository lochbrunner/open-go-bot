import { handleActions } from 'redux-actions';
import * as immutlable from 'immutable';
import * as Actions from '../constants/actions';

const initialRecord = immutlable.Record({
    board: {width: 19, height: 19}
});

const initialState = new initialRecord();

export default handleActions<immutlable.Map<string, any>, void>({
}, initialState);