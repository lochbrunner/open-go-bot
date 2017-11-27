import { handleActions } from 'redux-actions';
import * as immutlable from 'immutable'; 
import * as _ from 'lodash';
import * as Actions from '../constants/actions';
import {ActionPayload} from '../actions/game';

const initialRecord = immutlable.Record({
    field: immutlable.List(_.range(19*19).map(i => ({stone: 'empty', forbidden: false, liberties: 0}))),
    turn: 'black'
});

const initialState = new initialRecord();

function calcLiberties(state: immutlable.Map<string, any>, action: ActionPayload): immutlable.Map<string, any> {
    const player = action.player === 'white' ? 'black': 'white';
    const fieldWidth = state.get('width');
    const i = action.pos.x + action.pos.y*action.fieldWidth;
    const oldCell = state.getIn(['field', i]);
    oldCell.stone = action.player;
    oldCell.liberties = 1;
    return state.setIn(['field', i], oldCell).set('turn', player);
}

export default handleActions<immutlable.Map<string, any>, ActionPayload>({
    [Actions.SET_STONE]: (state, action) => {
        return calcLiberties(state, action.payload);
    }
}, initialState);