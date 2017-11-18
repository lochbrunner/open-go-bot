import { handleActions } from 'redux-actions';
import * as immutlable from 'immutable'; 
import * as _ from 'lodash';
import * as Actions from '../constants/actions';
import {ActionPayload} from '../actions/game';

const initialRecord = immutlable.Record({
    field: immutlable.List(_.range(19*19).map(i => ({stone: 'empty', forbidden: false}))),
    turn: 'black'
});

const initialState = new initialRecord();



export default handleActions<immutlable.Map<string, any>, ActionPayload>({
    [Actions.SET_STONE]: (state, action) => {
        const fieldWidth = state.get('width');
        const i = action.payload.pos.x + action.payload.pos.y*action.payload.fieldWidth;
        const oldCell = state.getIn(['field', i]); 
        oldCell.stone = action.payload.player;
        return state.setIn(['field', i],  oldCell).set('turn', action.payload.player === 'white' ? 'black': 'white')
    }
}, initialState);