import {handleActions} from 'redux-actions';
import * as immutlable from 'immutable';
import * as Actions from '../constants/actions';
import {ActionPayload} from '../actions/display-settings';

const initialRecord = immutlable.Record({
  showLiberties: true,
  showIsLiberty: true,
  showForbidden: true,
  showNextMove: true
});

const initialState = new initialRecord();

export default handleActions<immutlable.Map<string, any>, ActionPayload>({
  [Actions.TOGGLE_IS_LIBERTY_VIEW]: (
      state, action) => state.set('showIsLiberty', action.payload.nextValue),
             [Actions.TOGGLE_LIBERTIES_VIEW]: (state, action) =>
                 state.set('showLiberties', action.payload.nextValue),
             [Actions.TOGGLE_FORBIDDEN_VIEW]: (state, action) =>
                 state.set('showForbidden', action.payload.nextValue),
             [Actions.TOGGLE_NEXT_MOVE_VIEW]: (state, action) =>
                 state.set('showNextMove', action.payload.nextValue),
}, initialState);